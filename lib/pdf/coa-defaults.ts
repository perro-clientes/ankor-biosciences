import { COA_FORMAT, type CoaDoc, type CoaTable } from "./coa-schema";

/**
 * Textos precargados y "Plantilla base" (estructura del COA del Lote X, vacía).
 * Todo es editable desde el panel.
 */

export const DEFAULT_TITLE = "DATA CERTIFICATE OF INTERNAL ANALYSIS FROM MANUFACTURER";

export const DEFAULT_FOOTNOTES = [
  "** Total Cannabinoids = Neutral Cannabinoids + (Acidic Cannabinoids * 0.877)",
  "** Total THC = Delta-10-THC + Delta-8-THC + (Delta-8-THCA x 0.877) + Delta-9-THC + THC-O-acetate + (THCA ×0.877)",
  "** Total CBD = CBD + (CBDA x 0.877)",
  "NR= Not Reported, ND= Not Detected, *Reported by Dry Mass*; *analytical instrumentation used Cannabinoids: UHPLC-DAD, Moisture: Mass by Drying, Water Activity: Water Activity Meter, Foreign: Microscope*",
  "*Density tested at a temperature range between 19-24 °C, *Water Activity tested at a humidity range between 0-90% Relative Humidity.",
  "All OA samples are sampled by the client, All California State Compliant samples sampled using SAMPL-SOP-001.",
].join("\n");

/** Fijo de la hoja (no editable). */
export const FDA_DISCLAIMER =
  "FOOD AND DRUG ADMINISTRATION (FDA) DISCLOSURE THESE STATEMENTS HAVE NOT BEEN EVALUATED BY THE FDA AND ARE NOT INTENDED TO DIAGNOSE, TREAT, OR CURE ANY DISEASE. ALWAYS CHECK WITH YOUR PHYSICIAN BEFORE STARTING A NEW DIETARY SUPPLEMENT PROGRAM.";

export const ANALYTE_NAMES = [
  "CBC",
  "CBD",
  "CBDA",
  "CBDV",
  "CBG",
  "CBGA",
  "CBL",
  "CBN",
  "CBT",
  "Δ-8-THC",
  "Δ-9-THC",
  "THCA",
  "THCV",
  "Total THC**",
  "Total CBD**",
  "Total Cannabinoids**",
] as const;

let seq = 0;
/** Id para tablas nuevas (estable dentro del documento; no sale en el PDF). */
export function newTableId(): string {
  seq += 1;
  return `t${Date.now().toString(36)}${seq.toString(36)}`;
}

export function emptyTable(columns = 2, rows = 2, title = ""): CoaTable {
  return {
    id: newTableId(),
    title,
    columns: Array.from({ length: columns }, () => ""),
    rows: Array.from({ length: rows }, () => Array.from({ length: columns }, () => "")),
  };
}

/** Plantilla base: la estructura del COA del Lote X, con los valores vacíos. */
export function baseTemplate(notes: string = DEFAULT_FOOTNOTES): CoaDoc {
  return {
    format: COA_FORMAT,
    title: DEFAULT_TITLE,
    header: [
      { label: "Lot Number", value: "" },
      { label: "Oil Batch Sample Number", value: "" },
      { label: "Date Received", value: "" },
      { label: "Expiration Date", value: "" },
    ],
    tables: [
      {
        id: "overview",
        title: "Cannabinoid Overview",
        columns: ["", ""],
        rows: [
          ["Total THC:", ""],
          ["Total CBD:", ""],
          ["Total Cannabinoids:", ""],
          ["Sum of Cannabinoids:", ""],
        ],
      },
      {
        id: "batch",
        title: "Batch Result:",
        columns: ["", "", "", ""],
        rows: [
          ["Potency", "", "Microbial", ""],
          ["Solvents", "", "Mycotoxins", ""],
          ["Metals", "", "Pesticides", ""],
        ],
      },
      {
        id: "analytes",
        title: "",
        columns: [
          "Analyte",
          "Amt (mg/pkg)",
          "Amt (%)",
          "Amt (mg/ml)",
          "LOD/LOQ (mg/ml)",
          "Pass/Fail",
        ],
        rows: ANALYTE_NAMES.map((name) => [name, "", "", "", "", "N/A"]),
      },
    ],
    notes,
    footer: [
      { label: "Unit Batch", value: "" },
      { label: "Exp. Date", value: "" },
    ],
  };
}

/**
 * "Copiar estructura de otro lote": mismas líneas, tablas y columnas; con
 * `keepValues` false se vacían los valores (se conservan etiquetas, títulos,
 * nombres de fila de la primera columna y las notas).
 */
export function copyStructure(source: CoaDoc, keepValues: boolean): CoaDoc {
  if (keepValues) {
    return {
      ...structuredClone(source),
      tables: source.tables.map((t) => ({ ...structuredClone(t), id: newTableId() })),
    };
  }
  return {
    format: COA_FORMAT,
    title: source.title,
    header: source.header.map((l) => ({ label: l.label, value: "" })),
    tables: source.tables.map((t) => ({
      id: newTableId(),
      title: t.title,
      columns: [...t.columns],
      // La primera columna suele ser el nombre de la fila (analito, ensayo): se conserva.
      rows: t.rows.map((r) => r.map((cell, i) => (i === 0 ? cell : ""))),
    })),
    notes: source.notes,
    footer: source.footer.map((l) => ({ label: l.label, value: "" })),
  };
}
