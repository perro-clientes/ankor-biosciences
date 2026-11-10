import { z } from "zod";

/**
 * COA armado por bloques (formato 2). Mismo modelo para el editor del panel,
 * la vista previa y el PDF publicado; se guarda tal cual en
 * document_versions.data (jsonb).
 *
 *   título · líneas de encabezado · tablas · notas · líneas de pie
 *
 * Todo es texto: etiquetas, títulos de columna y celdas son editables porque
 * cambian según el batch. Lo que se escribe es lo que sale en el PDF (la red de
 * seguridad es la vista previa y volver a una versión anterior).
 * Fijos de la hoja: logo, marca de agua y disclaimer de la FDA.
 */

export const COA_FORMAT = 2;

const text = (max: number, what: string) =>
  z.string().max(max, `${what}: máximo ${max} caracteres.`);

export const lineSchema = z.object({
  label: text(80, "Etiqueta"),
  value: text(240, "Valor"),
});
export type CoaLine = z.infer<typeof lineSchema>;

export const tableSchema = z
  .object({
    /** Id estable para el editor (no sale en el PDF). */
    id: z.string().min(1).max(40),
    title: text(200, "Título de tabla"),
    columns: z
      .array(text(60, "Título de columna"))
      .min(1, "Una tabla necesita al menos una columna.")
      .max(12, "Máximo 12 columnas."),
    rows: z.array(z.array(text(160, "Celda"))).max(300, "Máximo 300 filas."),
  })
  .refine((t) => t.rows.every((r) => r.length === t.columns.length), {
    message: "Todas las filas tienen que tener la misma cantidad de celdas que columnas.",
    path: ["rows"],
  });
export type CoaTable = z.infer<typeof tableSchema>;

export const coaSchema = z
  .object({
    format: z.literal(COA_FORMAT),
    title: text(160, "Título"),
    header: z.array(lineSchema).max(30, "Máximo 30 líneas de encabezado."),
    tables: z.array(tableSchema).max(20, "Máximo 20 tablas."),
    notes: text(4000, "Notas"),
    footer: z.array(lineSchema).max(8, "Máximo 8 líneas de pie."),
  })
  .refine((d) => d.header.length + d.tables.length > 0, {
    message: "El COA está vacío: agregá al menos una línea de encabezado o una tabla.",
    path: ["tables"],
  });
export type CoaDoc = z.infer<typeof coaSchema>;

/** ¿Es un COA del formato actual? (los borradores viejos del formulario fijo no lo son). */
export function isCoaDoc(data: unknown): data is CoaDoc {
  return (
    typeof data === "object" &&
    data !== null &&
    (data as { format?: unknown }).format === COA_FORMAT
  );
}

/** Mensajes legibles para el editor: "Tabla 2 · fila 3: …". */
export function describeIssues(issues: z.core.$ZodIssue[]): string[] {
  return issues.map((issue) => {
    const [section, index, field] = issue.path;
    const n = typeof index === "number" ? index + 1 : null;
    const where =
      section === "tables" && n
        ? `Tabla ${n}${field === "rows" ? " · filas" : field === "columns" ? " · columnas" : ""}`
        : section === "header" && n
          ? `Encabezado · línea ${n}`
          : section === "footer" && n
            ? `Pie · línea ${n}`
            : section === "title"
              ? "Título"
              : section === "notes"
                ? "Notas"
                : "COA";
    return `${where}: ${issue.message}`;
  });
}
