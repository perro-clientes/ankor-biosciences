/**
 * Tokens del PDF. react-pdf no lee CSS variables, así que los colores van acá
 * (único lugar con hex de los PDF), alineados con app/globals.css.
 * Medidas en puntos (A4 = 595 × 842 pt), tomadas del COA del Lote X.
 */

export const colors = {
  ink: "#162311", // brand-ink: texto y logo
  green: "#517a5f", // brand-green: "Pass" (el original usaba un verde fosforescente ilegible)
  fail: "#b42318", // destructive
  border: "#9a9a9a", // bordes de tablas (gris del original)
  rule: "#c9c9c9", // separadores internos
  muted: "#bdbdbd", // "N/A" en la columna Pass/Fail
  watermark: "#f2f2f2", // hexágono de fondo
} as const;

export const fonts = {
  ui: "Chivo", // títulos, etiquetas, tablas (como el original)
  text: "Roboto", // notas al pie y disclaimer
} as const;

export const page = {
  paddingTop: 28,
  paddingX: 24,
  /** Espacio reservado abajo para el pie fijo (Unit Batch + FDA). */
  paddingBottom: 96,
} as const;
