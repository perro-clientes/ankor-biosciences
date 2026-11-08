import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { DEFAULT_FOOTNOTES, DEFAULT_TITLE } from "./coa-defaults";
import type { CoaData, CoaResult } from "./coa-schema";
import { formatAssayDate, formatLongDate, formatMonthYear } from "./format";
import { Footer, Logo, Watermark } from "./frame";
import { colors, fonts, page } from "./theme";

/**
 * Plantilla del COA. La misma genera la vista previa del panel y el PDF que se
 * publica: lo que se ve es lo que se publica. Estructura del COA del Lote X.
 */

const FONT_LABEL = 11;
const FONT_TABLE = 9;

const s = StyleSheet.create({
  page: {
    paddingTop: page.paddingTop,
    paddingBottom: page.paddingBottom,
    paddingHorizontal: page.paddingX,
    fontFamily: fonts.ui,
    fontSize: FONT_LABEL,
    color: colors.ink,
  },
  logoWrap: { alignItems: "center", marginLeft: 8, marginBottom: 30 },
  title: { fontWeight: 700, fontSize: 10.5, textAlign: "center", marginBottom: 14 },
  header: { marginLeft: 3, marginBottom: 26 },
  headerLine: { fontSize: FONT_LABEL, lineHeight: 1.36 },
  bold: { fontWeight: 700 },

  box: { borderWidth: 0.75, borderColor: colors.border, marginBottom: 26 },
  boxRow: {
    flexDirection: "row",
    borderTopWidth: 0.75,
    borderTopColor: colors.rule,
    paddingHorizontal: 9,
    paddingVertical: 4.5,
  },
  boxHead: { paddingHorizontal: 9, paddingTop: 5, paddingBottom: 4 },

  assayTitle: { fontWeight: 700, fontSize: FONT_LABEL, marginBottom: 15 },

  // Sin borde superior: lo pone el encabezado (fixed), así también aparece en la página 2.
  table: {
    width: 507,
    borderWidth: 0.75,
    borderTopWidth: 0,
    borderColor: colors.border,
    marginBottom: 22,
  },
  tHead: {
    flexDirection: "row",
    borderTopWidth: 0.75,
    borderTopColor: colors.border,
    borderBottomWidth: 0.75,
    borderBottomColor: colors.border,
    paddingVertical: 5,
    paddingHorizontal: 9,
  },
  tHeadCell: { fontWeight: 700, fontSize: FONT_TABLE },
  tRow: { flexDirection: "row", paddingHorizontal: 9, paddingVertical: 1.5 },
  tCell: { fontSize: FONT_TABLE },

  footnotes: { fontFamily: fonts.text, fontSize: 7.4, lineHeight: 1.3 },
});

/** Anchos de columna de la tabla de analitos (suman 100%). */
const COLS = {
  name: "22%",
  mgPerPkg: "15%",
  percent: "14%",
  mgPerMl: "16%",
  lodLoq: "20%",
  result: "13%",
} as const;

function resultColor(result: CoaResult) {
  if (result === "Pass") return colors.green;
  if (result === "Fail") return colors.fail;
  if (result === "N/A") return colors.muted;
  return colors.ink;
}

function HeaderLine({ label, value }: { label: string; value: string }) {
  return (
    <Text style={s.headerLine}>
      <Text style={s.bold}>{label}: </Text>
      {value}
    </Text>
  );
}

function Overview({ data }: { data: CoaData }) {
  const rows: [string, string][] = [
    ["Total THC:", data.overview.totalThc],
    ["Total CBD:", data.overview.totalCbd],
    ["Total Cannabinoids:", data.overview.totalCannabinoids],
    ["Sum of Cannabinoids:", data.overview.sumCannabinoids],
  ];
  return (
    <View style={[s.box, { width: 297 }]} wrap={false}>
      <Text style={[s.boxHead, s.bold]}>Cannabinoid Overview</Text>
      {rows.map(([label, value]) => (
        <View key={label} style={s.boxRow}>
          <Text style={[s.bold, { width: "60%" }]}>{label}</Text>
          <Text style={s.bold}>
            {value}
            {/^(ND|NR)$/i.test(value) ? "" : " mg/pkg"}
          </Text>
        </View>
      ))}
    </View>
  );
}

function BatchResult({ data }: { data: CoaData }) {
  const b = data.batch;
  const rows: [string, CoaResult, string, CoaResult][] = [
    ["Potency", b.potency, "Microbial", b.microbial],
    ["Solvents", b.solvents, "Mycotoxins", b.mycotoxins],
    ["Metals", b.metals, "Pesticides", b.pesticides],
  ];
  const cell = (r: CoaResult) => ({
    fontWeight: 700 as const,
    color: r === "Pass" || r === "Tested" ? colors.ink : resultColor(r),
  });
  return (
    <View style={[s.box, { width: 482 }]} wrap={false}>
      <Text style={[s.boxHead, s.bold]}>
        Batch Result: <Text style={{ color: resultColor(b.overall) }}>{b.overall}</Text>
      </Text>
      {rows.map(([l1, r1, l2, r2]) => (
        <View key={l1} style={s.boxRow}>
          <Text style={[s.bold, { width: "38%" }]}>{l1}</Text>
          <Text style={[cell(r1), { width: "17%" }]}>{r1}</Text>
          <Text style={[s.bold, { width: "34%" }]}>{l2}</Text>
          <Text style={[cell(r2), { width: "11%", textAlign: "right" }]}>{r2}</Text>
        </View>
      ))}
    </View>
  );
}

function AnalyteTable({ data }: { data: CoaData }) {
  return (
    <View style={s.table}>
      {/* fixed: el encabezado se repite en cada página donde siga la tabla. */}
      <View style={s.tHead} fixed>
        <Text style={[s.tHeadCell, { width: COLS.name }]}>Analyte</Text>
        <Text style={[s.tHeadCell, { width: COLS.mgPerPkg }]}>Amt (mg/pkg)</Text>
        <Text style={[s.tHeadCell, { width: COLS.percent }]}>Amt (%)</Text>
        <Text style={[s.tHeadCell, { width: COLS.mgPerMl }]}>Amt (mg/ml)</Text>
        <Text style={[s.tHeadCell, { width: COLS.lodLoq }]}>LOD/LOQ (mg/ml)</Text>
        <Text style={[s.tHeadCell, { width: COLS.result }]}>Pass/Fail</Text>
      </View>
      <View style={{ paddingVertical: 4 }}>
        {data.analytes.map((a, i) => (
          <View key={`${a.name}-${i}`} style={s.tRow} wrap={false}>
            <Text style={[s.tCell, { width: COLS.name }]}>{a.name}</Text>
            <Text style={[s.tCell, { width: COLS.mgPerPkg }]}>{a.mgPerPkg}</Text>
            <Text style={[s.tCell, { width: COLS.percent }]}>{a.percent}</Text>
            <Text style={[s.tCell, { width: COLS.mgPerMl }]}>{a.mgPerMl}</Text>
            <Text style={[s.tCell, { width: COLS.lodLoq }]}>
              {a.lod || a.loq ? `${a.lod}/${a.loq}` : ""}
            </Text>
            <Text style={[s.tCell, { width: COLS.result, color: resultColor(a.result) }]}>
              {a.result}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export type CoaDocumentProps = {
  data: CoaData;
  /** Notas al pie de la plantilla activa (tabla templates). */
  footnotes?: string;
  /** Marca "PREVIEW" para la vista previa del panel. */
  preview?: boolean;
};

export function CoaDocument({ data, footnotes = DEFAULT_FOOTNOTES, preview }: CoaDocumentProps) {
  const h = data.header;
  const expiration = `${formatLongDate(h.expirationDate)}${h.expirationNote ? ` *${h.expirationNote}` : ""}`;
  return (
    <Document
      title={`Certificate of Analysis — Lot ${h.lotNumber}`}
      author="Ankor Biosciences"
      subject={DEFAULT_TITLE}
      creator="ankor-bio.com"
      producer="ankor-bio.com"
      language="en"
    >
      <Page size="A4" style={s.page}>
        <Watermark />
        {preview && (
          <Text
            fixed
            style={{
              position: "absolute",
              top: 8,
              right: 15,
              fontSize: 8,
              fontWeight: 700,
              color: colors.fail,
            }}
          >
            PREVIEW — NOT PUBLISHED
          </Text>
        )}

        <View style={s.logoWrap}>
          <Logo />
        </View>
        <Text style={s.title}>{DEFAULT_TITLE}</Text>

        <View style={s.header}>
          <HeaderLine label="Lot Number" value={h.lotNumber} />
          <HeaderLine label="Oil Batch Sample Number" value={h.sampleNumber} />
          <HeaderLine label="Date Received" value={formatLongDate(h.dateReceived)} />
          <HeaderLine label="Expiration Date" value={expiration} />
        </View>

        <Overview data={data} />
        <BatchResult data={data} />

        <Text style={s.assayTitle} minPresenceAhead={60}>
          {data.assay.code}: {data.assay.name} -{" "}
          {formatAssayDate(data.assay.testedAt, data.assay.timeZone)}
        </Text>
        <AnalyteTable data={data} />

        {footnotes.trim() && (
          <View style={s.footnotes} wrap={false}>
            {footnotes.split("\n").map((line, i) => (
              <Text key={i}>{line}</Text>
            ))}
          </View>
        )}

        <Footer
          lines={[`Unit Batch: ${h.lotNumber}`, `Exp. Date: ${formatMonthYear(h.expirationDate)}`]}
        />
      </Page>
    </Document>
  );
}
