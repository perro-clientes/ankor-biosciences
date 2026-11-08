import { z } from "zod";

/**
 * Datos de un COA (Certificate of Analysis). Mismo schema para el formulario del
 * panel, la vista previa y el PDF publicado. Se guarda tal cual en
 * document_versions.data (jsonb).
 *
 * Los valores de laboratorio son strings: se respetan "ND", "NR", vacíos y la
 * cantidad de decimales que manda el laboratorio (0.000 ≠ 0). Nunca se
 * convierten a número.
 */

export const RESULTS = ["Pass", "Fail", "Tested", "N/A"] as const;
export const resultSchema = z.enum(RESULTS);
export type CoaResult = z.infer<typeof resultSchema>;

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use the format YYYY-MM-DD.")
  .refine((v) => !Number.isNaN(Date.parse(`${v}T00:00:00Z`)), "Invalid date.");

const text = (max: number) => z.string().trim().max(max);
const required = (max: number, message: string) => text(max).min(1, message);

/** Valor de laboratorio: número, ND, NR, <LOQ o vacío. */
const labValue = text(24).refine(
  (v) => v === "" || /^(ND|NR|<LOQ|N\/A)$/i.test(v) || /^[<>]?-?\d+(\.\d+)?$/.test(v),
  'Use a number, "ND", "NR", "<LOQ" or leave it empty.',
);

/** Total del overview: número o ND (obligatorio). */
const overviewValue = text(24).refine(
  (v) => /^(ND|NR)$/i.test(v) || /^-?\d+(\.\d+)?$/.test(v),
  'Use a number or "ND".',
);

export const analyteSchema = z.object({
  name: required(40, "Analyte name is required."),
  mgPerPkg: labValue,
  percent: labValue,
  mgPerMl: labValue,
  lod: labValue,
  loq: labValue,
  result: resultSchema,
});
export type Analyte = z.infer<typeof analyteSchema>;

export const coaSchema = z
  .object({
    header: z.object({
      lotNumber: required(40, "Lot number is required."),
      sampleNumber: required(120, "Oil batch sample number is required."),
      dateReceived: isoDate,
      expirationDate: isoDate,
      /** Texto que sigue al vencimiento, sin asterisco (ej. "Under Sealed Conditions"). */
      expirationNote: text(80),
    }),
    overview: z.object({
      totalThc: overviewValue,
      totalCbd: overviewValue,
      totalCannabinoids: overviewValue,
      sumCannabinoids: overviewValue,
    }),
    batch: z.object({
      overall: z.enum(["Pass", "Fail"]),
      potency: resultSchema,
      solvents: resultSchema,
      metals: resultSchema,
      microbial: resultSchema,
      mycotoxins: resultSchema,
      pesticides: resultSchema,
    }),
    assay: z.object({
      code: required(40, "Assay code is required."),
      name: required(60, "Assay name is required."),
      /** Fecha y hora local del ensayo, sin zona: YYYY-MM-DDTHH:mm[:ss]. */
      testedAt: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/, "Use the format YYYY-MM-DDTHH:mm."),
      timeZone: required(8, "Time zone is required (e.g. PDT)."),
    }),
    analytes: z.array(analyteSchema).min(1, "Add at least one analyte.").max(80),
  })
  .refine((c) => c.header.expirationDate > c.header.dateReceived, {
    message: "Expiration date must be after the date received.",
    path: ["header", "expirationDate"],
  });

export type CoaData = z.infer<typeof coaSchema>;
