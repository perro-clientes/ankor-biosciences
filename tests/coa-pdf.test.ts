/**
 * COA por bloques: schema, plantillas (base / copiar estructura) y PDF.
 */
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import * as fontkit from "fontkit";
import {
  ANALYTE_NAMES,
  DEFAULT_FOOTNOTES,
  baseTemplate,
  copyStructure,
  emptyTable,
} from "@/lib/pdf/coa-defaults";
import { COA_FORMAT, coaSchema, describeIssues, isCoaDoc, type CoaDoc } from "@/lib/pdf/coa-schema";
import { loteX } from "@/lib/pdf/fixtures/lote-x";
import { renderCoaPdf, renderPlaceholderPdf } from "@/lib/pdf/render";

const clone = (): CoaDoc => structuredClone(loteX);
const pageCount = (bytes: Uint8Array) =>
  (
    Buffer.from(bytes)
      .toString("latin1")
      .match(/\/Type \/Page\b/g) ?? []
  ).length;

describe("schema", () => {
  it("el Lote X y la plantilla base son válidos", () => {
    expect(coaSchema.safeParse(loteX).success).toBe(true);
    expect(coaSchema.safeParse(baseTemplate()).success).toBe(true);
  });

  it("todo es texto: ND, vacíos y fechas libres se guardan tal cual", () => {
    const parsed = coaSchema.parse(loteX);
    expect(parsed.header[2]).toEqual({ label: "Date Received", value: "16March2026" });
    expect(parsed.tables[2].rows[2]).toEqual(["CBDA", "", "ND", "ND", "0.0168/0.0505", "N/A"]);
  });

  it("filas con distinta cantidad de celdas que columnas no pasan", () => {
    const doc = clone();
    doc.tables[0].rows[0] = ["Total THC:"];
    const result = coaSchema.safeParse(doc);
    expect(result.success).toBe(false);
    expect(describeIssues(result.error!.issues)[0]).toMatch(/^Tabla 1/);
  });

  it("un COA sin encabezado ni tablas no pasa", () => {
    const doc = { ...clone(), header: [], tables: [] };
    expect(coaSchema.safeParse(doc).success).toBe(false);
  });

  it("isCoaDoc distingue el formato por bloques de los borradores viejos", () => {
    expect(isCoaDoc(loteX)).toBe(true);
    expect(isCoaDoc({ header: { lotNumber: "x" }, analytes: [] })).toBe(false);
    expect(isCoaDoc(null)).toBe(false);
  });
});

describe("plantillas", () => {
  it("la plantilla base trae la estructura del Lote X vacía", () => {
    const base = baseTemplate();
    expect(base.format).toBe(COA_FORMAT);
    expect(base.header.map((l) => l.label)).toEqual(loteX.header.map((l) => l.label));
    expect(base.header.every((l) => l.value === "")).toBe(true);
    expect(base.tables.map((t) => t.title)).toEqual(["Cannabinoid Overview", "Batch Result:", ""]);
    expect(base.tables[2].rows.map((r) => r[0])).toEqual([...ANALYTE_NAMES]);
    expect(base.notes).toBe(DEFAULT_FOOTNOTES);
  });

  it("copiar estructura sin valores conserva etiquetas, títulos y primera columna", () => {
    const copy = copyStructure(loteX, false);
    expect(copy.header.map((l) => l.label)).toEqual(loteX.header.map((l) => l.label));
    expect(copy.header.every((l) => l.value === "")).toBe(true);
    expect(copy.tables[2].columns).toEqual(loteX.tables[2].columns);
    expect(copy.tables[2].rows[0]).toEqual(["CBC", "", "", "", "", ""]);
    expect(copy.tables.map((t) => t.id)).not.toEqual(loteX.tables.map((t) => t.id));
    expect(coaSchema.safeParse(copy).success).toBe(true);
  });

  it("copiar con valores es igual salvo los ids de tabla", () => {
    const withoutIds = (d: CoaDoc) => ({ ...d, tables: d.tables.map((t) => ({ ...t, id: "" })) });
    expect(withoutIds(copyStructure(loteX, true))).toEqual(withoutIds(loteX));
  });

  it("tabla vacía", () => {
    const t = emptyTable(3, 2);
    expect(t.columns).toEqual(["", "", ""]);
    expect(t.rows).toEqual([
      ["", "", ""],
      ["", "", ""],
    ]);
  });
});

describe("fuentes embebidas", () => {
  it.each(["Chivo-Regular", "Chivo-Bold", "Roboto-Regular", "Roboto-Bold"])(
    "%s tiene Δ",
    (name) => {
      const font = fontkit.openSync(join(process.cwd(), "lib", "pdf", "fonts", `${name}.ttf`));
      expect("hasGlyphForCodePoint" in font && font.hasGlyphForCodePoint(0x394)).toBe(true);
    },
  );
});

describe("generación del PDF", () => {
  it("genera el COA del Lote X en 2 páginas A4", async () => {
    const pdf = await renderCoaPdf({ data: loteX });
    expect(Buffer.from(pdf.bytes.subarray(0, 5)).toString("latin1")).toBe("%PDF-");
    expect(pdf.sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(pageCount(pdf.bytes)).toBe(2);
    expect(Buffer.from(pdf.bytes).toString("latin1")).toMatch(
      /\/MediaBox \[0 0 595\.28\d* 841\.89\d*\]/,
    );
  }, 30_000);

  it("una tabla larga agrega páginas", async () => {
    const doc = clone();
    doc.tables[2].rows = Array.from({ length: 90 }, (_, i) => [`A${i}`, "1", "2", "3", "4", "N/A"]);
    expect(pageCount((await renderCoaPdf({ data: doc })).bytes)).toBeGreaterThanOrEqual(3);
  }, 30_000);

  it("acepta estructuras distintas (encabezado y pie del formato viejo, sin notas)", async () => {
    const doc: CoaDoc = {
      format: COA_FORMAT,
      title: "",
      header: [
        { label: "TYPE", value: "Phytocannabinoid-Rich Hemp Oil/THC-free" },
        { label: "Lot Number", value: "#23024" },
      ],
      tables: [{ id: "x", title: "", columns: ["A", "B", "C"], rows: [["1", "2", "3"]] }],
      notes: "",
      footer: [{ label: "UNIT BATCH", value: "#23024" }],
    };
    const pdf = await renderCoaPdf({ data: doc });
    expect(pageCount(pdf.bytes)).toBe(1);
  }, 30_000);

  it("no genera un COA inválido", async () => {
    const doc = clone();
    doc.tables[0].columns = [];
    await expect(renderCoaPdf({ data: doc })).rejects.toThrow();
  });

  it("genera el placeholder en 1 página", async () => {
    expect(pageCount((await renderPlaceholderPdf("Lote XII")).bytes)).toBe(1);
  }, 30_000);
});
