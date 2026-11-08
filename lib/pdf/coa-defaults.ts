import type { Analyte } from "./coa-schema";

/**
 * Valores por defecto de la plantilla v1. En producción salen de la tabla
 * `templates` (solo un admin los edita); estos son la semilla y el fallback.
 * Tomados del COA del Lote X (LE260008).
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

export const FDA_DISCLAIMER =
  "FOOD AND DRUG ADMINISTRATION (FDA) DISCLOSURE THESE STATEMENTS HAVE NOT BEEN EVALUATED BY THE FDA AND ARE NOT INTENDED TO DIAGNOSE, TREAT, OR CURE ANY DISEASE. ALWAYS CHECK WITH YOUR PHYSICIAN BEFORE STARTING A NEW DIETARY SUPPLEMENT PROGRAM.";

/** Lista de analitos precargada (editable en el formulario). */
export const DEFAULT_ANALYTE_NAMES = [
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

export const emptyAnalyte = (name = ""): Analyte => ({
  name,
  mgPerPkg: "",
  percent: "",
  mgPerMl: "",
  lod: "",
  loq: "",
  result: "N/A",
});

export const defaultAnalytes = (): Analyte[] => DEFAULT_ANALYTE_NAMES.map((n) => emptyAnalyte(n));
