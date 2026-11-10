/**
 * Pegado de rangos de Excel / CSV en una tabla del COA.
 */
import { describe, expect, it } from "vitest";
import { parseGrid, pasteWarnings } from "@/lib/pdf/paste";

describe("parseGrid", () => {
  it("lee un rango de Excel (tabs) y respeta ND y vacíos", () => {
    const grid = parseGrid(
      ["Analyte\tAmt (mg/pkg)\tAmt (%)", "CBC\t197\t0.163", "CBDA\t\tND"].join("\r\n"),
    );
    expect(grid).toEqual([
      ["Analyte", "Amt (mg/pkg)", "Amt (%)"],
      ["CBC", "197", "0.163"],
      ["CBDA", "", "ND"],
    ]);
  });

  it("iguala la cantidad de columnas", () => {
    expect(parseGrid("a\tb\tc\nd")).toEqual([
      ["a", "b", "c"],
      ["d", "", ""],
    ]);
  });

  it("acepta CSV con comillas y comillas escapadas", () => {
    expect(parseGrid('"CBG",188,"0.00795/0.0348","dice ""hola"""')).toEqual([
      ["CBG", "188", "0.00795/0.0348", 'dice "hola"'],
    ]);
  });

  it("ignora renglones vacíos", () => {
    expect(parseGrid("\n  \nx\n\n")).toEqual([["x"]]);
  });
});

describe("pasteWarnings", () => {
  it('avisa "-THC" sin Δ', () => {
    expect(
      pasteWarnings([
        ["-THC", "ND"],
        ["CBD", "1"],
      ])[0],
    ).toMatch(/Fila 1.*Δ/);
    expect(pasteWarnings([["Δ-9-THC", "ND"]])).toEqual([]);
  });
});
