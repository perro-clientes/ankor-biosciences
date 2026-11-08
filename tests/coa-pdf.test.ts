/**
 * Plantilla del COA: schema, formatos y generación del PDF.
 */
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import * as fontkit from "fontkit";
import { DEFAULT_ANALYTE_NAMES, defaultAnalytes } from "@/lib/pdf/coa-defaults";
import { coaSchema, type CoaData } from "@/lib/pdf/coa-schema";
import { loteX } from "@/lib/pdf/fixtures/lote-x";
import { formatAssayDate, formatLongDate, formatMonthYear } from "@/lib/pdf/format";
import { renderCoaPdf, renderPlaceholderPdf } from "@/lib/pdf/render";

const clone = (): CoaData => structuredClone(loteX);
const pageCount = (bytes: Uint8Array) =>
  (
    Buffer.from(bytes)
      .toString("latin1")
      .match(/\/Type \/Page\b/g) ?? []
  ).length;

describe("schema del COA", () => {
  it("el COA del Lote X es válido", () => {
    expect(coaSchema.safeParse(loteX).success).toBe(true);
  });

  it("respeta ND, vacíos y decimales tal cual (no convierte a número)", () => {
    const parsed = coaSchema.parse(loteX);
    expect(parsed.overview.totalThc).toBe("0.000");
    const cbda = parsed.analytes.find((a) => a.name === "CBDA")!;
    expect(cbda.mgPerPkg).toBe("");
    expect(cbda.percent).toBe("ND");
  });

  it("rechaza un vencimiento anterior a la recepción", () => {
    const data = clone();
    data.header.expirationDate = "2026-01-01";
    const result = coaSchema.safeParse(data);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual(["header", "expirationDate"]);
  });

  it("rechaza valores de laboratorio inválidos y campos obligatorios vacíos", () => {
    const data = clone();
    data.analytes[0].percent = "abc";
    data.header.lotNumber = " ";
    const paths = coaSchema.safeParse(data).error?.issues.map((i) => i.path.join("."));
    expect(paths).toContain("analytes.0.percent");
    expect(paths).toContain("header.lotNumber");
  });

  it("acepta <LOQ, NR y valores con signo", () => {
    const data = clone();
    data.analytes[0].percent = "<LOQ";
    data.analytes[1].percent = "NR";
    data.analytes[2].mgPerMl = "<0.01";
    expect(coaSchema.safeParse(data).success).toBe(true);
  });

  it("la lista de analitos precargada incluye Δ-8-THC y Δ-9-THC", () => {
    expect(DEFAULT_ANALYTE_NAMES).toContain("Δ-8-THC");
    expect(DEFAULT_ANALYTE_NAMES).toContain("Δ-9-THC");
    expect(defaultAnalytes()).toHaveLength(DEFAULT_ANALYTE_NAMES.length);
  });
});

describe("formatos de fecha", () => {
  it("formatea como el COA", () => {
    expect(formatLongDate("2026-03-16")).toBe("16 March 2026");
    expect(formatMonthYear("2028-03-30")).toBe("March 2028");
    expect(formatAssayDate("2026-03-19T14:37:00", "PDT")).toBe("Mar 19, 2026 14:37:00 PDT");
    expect(formatAssayDate("2026-03-19T14:37", "PDT")).toBe("Mar 19, 2026 14:37:00 PDT");
  });
});

describe("fuentes embebidas", () => {
  it.each(["Chivo-Regular", "Chivo-Bold", "Roboto-Regular", "Roboto-Bold"])(
    "%s tiene el glifo Δ",
    (name) => {
      const font = fontkit.openSync(join(process.cwd(), "lib", "pdf", "fonts", `${name}.ttf`));
      expect("hasGlyphForCodePoint" in font && font.hasGlyphForCodePoint(0x394)).toBe(true);
    },
  );
});

describe("generación del PDF", () => {
  it("genera el COA del Lote X en 2 páginas A4", async () => {
    const pdf = await renderCoaPdf({ data: loteX });
    const head = Buffer.from(pdf.bytes.subarray(0, 5)).toString("latin1");
    expect(head).toBe("%PDF-");
    expect(pdf.size).toBeGreaterThan(10_000);
    expect(pdf.sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(pageCount(pdf.bytes)).toBe(2);
    expect(Buffer.from(pdf.bytes).toString("latin1")).toMatch(
      /\/MediaBox \[0 0 595\.28\d* 841\.89\d*\]/,
    );
  }, 30_000);

  it("con muchos analitos agrega páginas (el encabezado de la tabla se repite)", async () => {
    const data = clone();
    data.analytes = Array.from({ length: 70 }, (_, i) => ({ ...loteX.analytes[0], name: `A${i}` }));
    const pdf = await renderCoaPdf({ data });
    expect(pageCount(pdf.bytes)).toBeGreaterThanOrEqual(3);
  }, 30_000);

  it("no genera un COA inválido", async () => {
    const data = clone();
    data.header.dateReceived = "fecha";
    await expect(renderCoaPdf({ data })).rejects.toThrow();
  });

  it("genera el placeholder en 1 página", async () => {
    const pdf = await renderPlaceholderPdf("Lote XII");
    expect(Buffer.from(pdf.bytes.subarray(0, 5)).toString("latin1")).toBe("%PDF-");
    expect(pageCount(pdf.bytes)).toBe(1);
  }, 30_000);
});
