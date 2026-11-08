import type { CoaData } from "../coa-schema";

/**
 * Datos del COA del Lote X (LE260008), transcriptos del PDF publicado
 * (legacy/private-info/AnkorBiosciences-COA-LoteX-PDFforQrCode.pdf).
 * Se usan para comparar la plantilla con el original y en los tests.
 *
 * En el original las filas Δ-8-THC y Δ-9-THC aparecen como "-THC" (la fuente
 * no tenía Δ); el orden y los LOD/LOQ son los del PDF.
 */
const row = (
  name: string,
  mgPerPkg: string,
  percent: string,
  mgPerMl: string,
  lod: string,
  loq: string,
) => ({ name, mgPerPkg, percent, mgPerMl, lod, loq, result: "N/A" as const });

export const loteX: CoaData = {
  header: {
    lotNumber: "LE260008",
    sampleNumber: "ICC-260316-29-001 5000Mg/100Ml. Orange",
    dateReceived: "2026-03-16",
    expirationDate: "2028-03-30",
    expirationNote: "Under Sealed Conditions",
  },
  overview: {
    totalThc: "0.000",
    totalCbd: "6890",
    totalCannabinoids: "7520",
    sumCannabinoids: "7520",
  },
  batch: {
    overall: "Pass",
    potency: "Tested",
    solvents: "Pass",
    metals: "Pass",
    microbial: "Pass",
    mycotoxins: "Pass",
    pesticides: "Pass",
  },
  assay: {
    code: "POT-INST-005",
    name: "Potency",
    testedAt: "2026-03-19T14:37:00",
    timeZone: "PDT",
  },
  analytes: [
    row("CBC", "197", "0.163", "1.53", "0.0230", "0.0690"),
    row("CBD", "6890", "5.71", "53.4", "0.00703", "0.0348"),
    row("CBDA", "", "ND", "ND", "0.0168", "0.0505"),
    row("CBDV", "31.4", "0.0260", "0.243", "0.00558", "0.0348"),
    row("CBG", "188", "0.156", "1.46", "0.00795", "0.0348"),
    row("CBGA", "", "ND", "ND", "0.0124", "0.0373"),
    row("CBL", "", "ND", "ND", "0.00548", "0.0348"),
    row("CBN", "194", "0.161", "1.51", "0.00795", "0.0348"),
    row("CBT", "13.2", "0.0109", "0.012", "0.0100", "0.0348"),
    row("Δ-8-THC", "", "ND", "ND", "0.00563", "0.0348"),
    row("Δ-9-THC", "", "ND", "ND", "0.00930", "0.0348"),
    row("THCA", "", "ND", "ND", "0.0128", "0.0384"),
    row("THCV", "", "ND", "ND", "0.00431", "0.0348"),
    row("Total THC**", "", "ND", "ND", "", ""),
    row("Total CBD**", "6890", "5.71", "53.4", "", ""),
    row("Total Cannabinoids**", "7520", "6.23", "58.3", "", ""),
  ],
};
