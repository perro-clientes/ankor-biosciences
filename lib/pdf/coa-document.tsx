import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { CoaDoc, CoaLine, CoaTable } from "./coa-schema";
import { Footer, Logo, Watermark } from "./frame";
import { colors, fonts, page } from "./theme";

/**
 * Plantilla del COA por bloques. La misma genera la vista previa del panel y el
 * PDF que se publica: lo que se ve es lo que se publica.
 *
 * Estilo de cada tabla (sin opciones, por regla, para parecerse al Lote X):
 * - Sin títulos de columna → "caja": título adentro, todo en negrita, línea
 *   entre filas (Cannabinoid Overview, Batch Result).
 * - Con títulos de columna → "grilla": título arriba, encabezado en negrita
 *   que se repite en cada página, celdas normales (tabla de analitos).
 */

const FONT_LABEL = 11;
const FONT_GRID = 9;
const GRID_WIDTH = 507;

const s = StyleSheet.create({
  page: {
    paddingTop: page.paddingTop,
    paddingHorizontal: page.paddingX,
    fontFamily: fonts.ui,
    fontSize: FONT_LABEL,
    color: colors.ink,
  },
  logoWrap: { alignItems: "center", marginLeft: 8, marginBottom: 30 },
  title: { fontWeight: 700, fontSize: 10.5, textAlign: "center", marginBottom: 14 },
  header: { marginLeft: 3, marginBottom: 26 },
  line: { fontSize: FONT_LABEL, lineHeight: 1.36 },
  bold: { fontWeight: 700 },

  box: { borderWidth: 0.75, borderColor: colors.border, marginBottom: 26 },
  boxTitle: { fontWeight: 700, paddingHorizontal: 9, paddingTop: 5, paddingBottom: 4 },
  boxRow: {
    flexDirection: "row",
    borderTopWidth: 0.75,
    borderTopColor: colors.rule,
    paddingHorizontal: 9,
    paddingVertical: 4.5,
  },

  gridTitle: { fontWeight: 700, fontSize: FONT_LABEL, marginBottom: 15 },
  grid: {
    width: GRID_WIDTH,
    borderWidth: 0.75,
    borderTopWidth: 0,
    borderColor: colors.border,
    marginBottom: 22,
  },
  gridHead: {
    flexDirection: "row",
    borderTopWidth: 0.75,
    borderTopColor: colors.border,
    borderBottomWidth: 0.75,
    borderBottomColor: colors.border,
    paddingVertical: 5,
    paddingHorizontal: 9,
  },
  gridRow: { flexDirection: "row", paddingHorizontal: 9, paddingVertical: 1.5 },
  cellPad: { paddingRight: 6 },

  notes: { fontFamily: fonts.text, fontSize: 7.4, lineHeight: 1.3, marginBottom: 12 },
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Color por resultado: Pass verde, Fail rojo, N/A gris. */
function resultColor(value: string): string | undefined {
  const v = value.trim().toLowerCase();
  if (v === "pass") return colors.green;
  if (v === "fail") return colors.fail;
  if (v === "n/a") return colors.muted;
  return undefined;
}

/** "Batch Result: Pass" → el "Pass" final sale en color. */
function TitleText({ title, style }: { title: string; style: (typeof s)[keyof typeof s] }) {
  const match = /^(.*:\s*)(pass|fail)$/i.exec(title.trim());
  if (!match) return <Text style={style}>{title}</Text>;
  return (
    <Text style={style}>
      {match[1]}
      <Text style={{ color: resultColor(match[2]) }}>{match[2]}</Text>
    </Text>
  );
}

/** Ancho relativo de cada columna según el texto más largo (título o celdas). */
function columnWeights(table: CoaTable): number[] {
  return table.columns.map((col, i) => {
    const longest = Math.max(col.length, ...table.rows.map((r) => (r[i] ?? "").length));
    return Math.min(Math.max(longest, 4), 28);
  });
}

function widths(table: CoaTable): string[] {
  const w = columnWeights(table);
  const total = w.reduce((a, b) => a + b, 0) || 1;
  return w.map((x) => `${((x / total) * 100).toFixed(3)}%`);
}

const hasColumnTitles = (t: CoaTable) => t.columns.some((c) => c.trim() !== "");

function Line({ line }: { line: CoaLine }) {
  if (!line.label.trim()) return <Text style={s.line}>{line.value}</Text>;
  return (
    <Text style={s.line}>
      <Text style={s.bold}>{line.label.trim().replace(/:$/, "")}: </Text>
      {line.value}
    </Text>
  );
}

// ─── Tablas ──────────────────────────────────────────────────────────────────

function BoxTable({ table }: { table: CoaTable }) {
  const cols = table.columns.length;
  const width = cols <= 2 ? 297 : cols === 3 ? 400 : 482;
  const w = widths(table);
  return (
    <View style={[s.box, { width }]} wrap={false}>
      {table.title.trim() !== "" && <TitleText title={table.title} style={s.boxTitle} />}
      {table.rows.map((row, r) => (
        <View
          key={r}
          style={[s.boxRow, r === 0 && !table.title.trim() ? { borderTopWidth: 0 } : {}]}
        >
          {row.map((cell, c) => (
            <Text
              key={c}
              style={[
                s.bold,
                s.cellPad,
                {
                  width: w[c],
                  color: resultColor(cell) === colors.fail ? colors.fail : colors.ink,
                },
                c === cols - 1 && cols > 2 ? { textAlign: "right", paddingRight: 0 } : {},
              ]}
            >
              {cell}
            </Text>
          ))}
        </View>
      ))}
    </View>
  );
}

function GridTable({ table }: { table: CoaTable }) {
  const w = widths(table);
  return (
    <>
      {table.title.trim() !== "" && <TitleText title={table.title} style={s.gridTitle} />}
      <View style={s.grid}>
        {/* fixed: el encabezado se repite en cada página donde siga la tabla. */}
        <View style={s.gridHead} fixed>
          {table.columns.map((col, c) => (
            <Text key={c} style={[s.bold, s.cellPad, { width: w[c], fontSize: FONT_GRID }]}>
              {col}
            </Text>
          ))}
        </View>
        <View style={{ paddingVertical: 4 }}>
          {table.rows.map((row, r) => (
            <View key={r} style={s.gridRow} wrap={false}>
              {row.map((cell, c) => (
                <Text
                  key={c}
                  style={[
                    s.cellPad,
                    { width: w[c], fontSize: FONT_GRID, color: resultColor(cell) },
                  ]}
                >
                  {cell}
                </Text>
              ))}
            </View>
          ))}
        </View>
      </View>
    </>
  );
}

// ─── Documento ───────────────────────────────────────────────────────────────

export type CoaDocumentProps = {
  data: CoaDoc;
  /** Marca "PREVIEW" para la vista previa del panel. */
  preview?: boolean;
};

export function CoaDocument({ data, preview }: CoaDocumentProps) {
  const footerLines = data.footer.filter((l) => l.label.trim() || l.value.trim());
  // Espacio para el pie fijo: disclaimer + una línea por cada línea de pie.
  const paddingBottom = page.paddingBottom - 30 + footerLines.length * 15;
  const lotLine = data.header.find((l) => /lot/i.test(l.label))?.value;

  return (
    <Document
      title={`Certificate of Analysis${lotLine ? ` — ${lotLine}` : ""}`}
      author="Ankor Biosciences"
      subject={data.title}
      creator="ankor-bio.com"
      producer="ankor-bio.com"
      language="en"
    >
      <Page size="A4" style={[s.page, { paddingBottom }]}>
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
        {data.title.trim() !== "" && <Text style={s.title}>{data.title}</Text>}

        {data.header.length > 0 && (
          <View style={s.header}>
            {data.header.map((line, i) => (
              <Line key={i} line={line} />
            ))}
          </View>
        )}

        {data.tables.map((table) =>
          hasColumnTitles(table) ? (
            <GridTable key={table.id} table={table} />
          ) : (
            <BoxTable key={table.id} table={table} />
          ),
        )}

        {data.notes.trim() && (
          <View style={s.notes} wrap={false}>
            {data.notes.split("\n").map((line, i) => (
              <Text key={i}>{line}</Text>
            ))}
          </View>
        )}

        <Footer
          lines={footerLines.map((l) =>
            l.label.trim() ? `${l.label.trim().replace(/:$/, "")}: ${l.value}` : l.value,
          )}
        />
      </Page>
    </Document>
  );
}
