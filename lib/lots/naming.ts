/**
 * Nombres y URLs de lote (testeable).
 *
 * La URL completa (prefijo + file_name) es lo que se imprime en el QR: una vez
 * creado el lote no cambia nunca.
 * - Lotes nuevos:   https://ankor-bio.com/coa/lote-xii.pdf
 * - Sitio anterior: https://ankor-bio.com/private-info/AnkorBiosciences-COA-LoteXI-PDFforQrCode.pdf
 *   (hubo varios esquemas; por eso cada documento guarda su nombre y prefijo exactos).
 */

import { site } from "@/content/site";

export const URL_PREFIXES = ["coa", "private-info"] as const;
export type UrlPrefix = (typeof URL_PREFIXES)[number];
/** Prefijo de los lotes nuevos. Los legacy quedan en "private-info". */
export const NEW_LOT_PREFIX: UrlPrefix = "coa";

/** Ruta pública de un documento: "/coa/lote-xii.pdf". */
export function publicPdfPath(fileName: string, prefix: UrlPrefix): string {
  return `/${prefix}/${encodeURIComponent(fileName)}`;
}

/** URL pública final (producción) de un documento: es lo que codifica el QR. */
export function publicPdfUrl(fileName: string, prefix: UrlPrefix): string {
  return `${site.url}${publicPdfPath(fileName, prefix)}`;
}

/** Mismo patrón que el check de la base (documents.file_name) y la ruta /private-info. */
export const FILE_NAME_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,199}\.pdf$/;

export function isValidFileName(name: string): boolean {
  return FILE_NAME_PATTERN.test(name) && !name.includes("..");
}

const ROMAN: [number, string][] = [
  [1000, "M"],
  [900, "CM"],
  [500, "D"],
  [400, "CD"],
  [100, "C"],
  [90, "XC"],
  [50, "L"],
  [40, "XL"],
  [10, "X"],
  [9, "IX"],
  [5, "V"],
  [4, "IV"],
  [1, "I"],
];

export function toRoman(n: number): string {
  if (!Number.isInteger(n) || n < 1 || n > 3999) throw new RangeError(`Fuera de rango: ${n}`);
  let out = "";
  for (const [value, symbol] of ROMAN) {
    while (n >= value) {
      out += symbol;
      n -= value;
    }
  }
  return out;
}

/** "XII" → 12. Devuelve null si no es un romano canónico. */
export function fromRoman(roman: string): number | null {
  if (!/^[MDCLXVI]+$/.test(roman)) return null;
  const values: Record<string, number> = { M: 1000, D: 500, C: 100, L: 50, X: 10, V: 5, I: 1 };
  let total = 0;
  for (let i = 0; i < roman.length; i++) {
    const v = values[roman[i]];
    const next = values[roman[i + 1]] ?? 0;
    total += v < next ? -v : v;
  }
  return total > 0 && total < 4000 && toRoman(total) === roman ? total : null;
}

/**
 * Número de lote de un file_name: esquema nuevo ("lote-xii.pdf") o del sitio
 * anterior ("…-COA-LoteXI-PDFforQrCode.pdf", "…-COA2020-LoteIV-…").
 */
export function lotNumberOf(fileName: string): number | null {
  const current = /^lote-([mdclxvi]+)\.pdf$/.exec(fileName);
  if (current) return fromRoman(current[1].toUpperCase());
  const legacy = /-Lote([MDCLXVI]+)-PDFforQrCode\.pdf$/.exec(fileName);
  return legacy ? fromRoman(legacy[1]) : null;
}

/** 12 → "lote-xii.pdf" (minúsculas: nadie se equivoca al tipearla). */
export function fileNameForLot(n: number): string {
  return `lote-${toRoman(n).toLowerCase()}.pdf`;
}

export function labelForLot(n: number): string {
  return `Lote ${toRoman(n)}`;
}

/** Sugerencia para el próximo lote: el mayor número existente + 1. */
export function suggestNextLot(existingFileNames: string[]): {
  number: number;
  fileName: string;
  label: string;
} {
  const max = existingFileNames.reduce((acc, name) => Math.max(acc, lotNumberOf(name) ?? 0), 0);
  const n = max + 1;
  return { number: n, fileName: fileNameForLot(n), label: labelForLot(n) };
}
