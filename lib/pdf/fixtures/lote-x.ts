import { DEFAULT_FOOTNOTES, DEFAULT_TITLE } from "../coa-defaults";
import { COA_FORMAT, type CoaDoc } from "../coa-schema";

/**
 * COA del Lote X (LE260008) en el formato por bloques, transcripto del PDF
 * publicado (legacy/private-info/AnkorBiosciences-COA-LoteX-PDFforQrCode.pdf).
 * Se usa para comparar la plantilla con el original y en los tests.
 * En el original las filas Δ-8-THC y Δ-9-THC aparecen como "-THC".
 */
const a = (name: string, pkg: string, pct: string, ml: string, lodLoq: string) => [
  name,
  pkg,
  pct,
  ml,
  lodLoq,
  "N/A",
];

export const loteX: CoaDoc = {
  format: COA_FORMAT,
  title: DEFAULT_TITLE,
  header: [
    { label: "Lot Number", value: "LE260008" },
    { label: "Oil Batch Sample Number", value: "ICC-260316-29-001 5000Mg/100Ml. Orange" },
    { label: "Date Received", value: "16March2026" },
    { label: "Expiration Date", value: "30March2028 *Under Sealed Conditions" },
  ],
  tables: [
    {
      id: "overview",
      title: "Cannabinoid Overview",
      columns: ["", ""],
      rows: [
        ["Total THC:", "0.000 mg/pkg"],
        ["Total CBD:", "6890 mg/pkg"],
        ["Total Cannabinoids:", "7520 mg/pkg"],
        ["Sum of Cannabinoids:", "7520 mg/pkg"],
      ],
    },
    {
      id: "batch",
      title: "Batch Result: Pass",
      columns: ["", "", "", ""],
      rows: [
        ["Potency", "Tested", "Microbial", "Pass"],
        ["Solvents", "Pass", "Mycotoxins", "Pass"],
        ["Metals", "Pass", "Pesticides", "Pass"],
      ],
    },
    {
      id: "analytes",
      title: "POT-INST-005: Potency - Mar 19, 2026 14:37:00 PDT",
      columns: [
        "Analyte",
        "Amt (mg/pkg)",
        "Amt (%)",
        "Amt (mg/ml)",
        "LOD/LOQ (mg/ml)",
        "Pass/Fail",
      ],
      rows: [
        a("CBC", "197", "0.163", "1.53", "0.0230/0.0690"),
        a("CBD", "6890", "5.71", "53.4", "0.00703/0.0348"),
        a("CBDA", "", "ND", "ND", "0.0168/0.0505"),
        a("CBDV", "31.4", "0.0260", "0.243", "0.00558/0.0348"),
        a("CBG", "188", "0.156", "1.46", "0.00795/0.0348"),
        a("CBGA", "", "ND", "ND", "0.0124/0.0373"),
        a("CBL", "", "ND", "ND", "0.00548/0.0348"),
        a("CBN", "194", "0.161", "1.51", "0.00795/0.0348"),
        a("CBT", "13.2", "0.0109", "0.012", "0.0100/0.0348"),
        a("Δ-8-THC", "", "ND", "ND", "0.00563/0.0348"),
        a("Δ-9-THC", "", "ND", "ND", "0.00930/0.0348"),
        a("THCA", "", "ND", "ND", "0.0128/0.0384"),
        a("THCV", "", "ND", "ND", "0.00431/0.0348"),
        a("Total THC**", "", "ND", "ND", ""),
        a("Total CBD**", "6890", "5.71", "53.4", ""),
        a("Total Cannabinoids**", "7520", "6.23", "58.3", ""),
      ],
    },
  ],
  notes: DEFAULT_FOOTNOTES,
  footer: [
    { label: "Unit Batch", value: "LE260008" },
    { label: "Exp. Date", value: "March 2028" },
  ],
};
