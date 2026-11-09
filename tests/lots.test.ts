/**
 * Lotes: nombres (romanos, sugerencia del siguiente) y QR.
 */
import { describe, expect, it } from "vitest";
import inventory from "../inventory.json";
import {
  fileNameForLot,
  fromRoman,
  isValidFileName,
  lotNumberOf,
  NEW_LOT_PREFIX,
  publicPdfPath,
  publicPdfUrl,
  suggestNextLot,
  toRoman,
} from "@/lib/lots/naming";
import { QR_PNG_SIZE, qrDownloadName, qrPng, qrSvg } from "@/lib/lots/qr";

const legacyNames = inventory.files.map((f) => f.fileName);

describe("números romanos", () => {
  it.each([
    [1, "I"],
    [4, "IV"],
    [9, "IX"],
    [11, "XI"],
    [12, "XII"],
    [14, "XIV"],
    [40, "XL"],
    [99, "XCIX"],
  ])("%i ↔ %s", (n, roman) => {
    expect(toRoman(n)).toBe(roman);
    expect(fromRoman(roman)).toBe(n);
  });

  it("rechaza romanos no canónicos o inválidos", () => {
    expect(fromRoman("IIII")).toBeNull();
    expect(fromRoman("Prueba")).toBeNull();
    expect(fromRoman("")).toBeNull();
  });
});

describe("nombres de lote", () => {
  it("lee el número del esquema nuevo y de los del sitio anterior", () => {
    expect(lotNumberOf("lote-xii.pdf")).toBe(12);
    expect(lotNumberOf("lote-xiv.pdf")).toBe(14);
    expect(lotNumberOf("Lote-XII.pdf")).toBeNull();
    expect(lotNumberOf("AnkorBiosciences-COA-LoteXI-PDFforQrCode.pdf")).toBe(11);
    expect(lotNumberOf("AnkorBiosciences-COA2020-LoteIV-PDFforQrCode.pdf")).toBe(4);
    expect(lotNumberOf("AnkorBiosciences-COA2020-LotePrueba-PDFforQrCode.pdf")).toBeNull();
    expect(lotNumberOf("AnkorBiosciences-COA-PDFforQrCode.pdf")).toBeNull();
  });

  it("con los 12 PDFs actuales sugiere lote-xii.pdf", () => {
    expect(suggestNextLot(legacyNames)).toEqual({
      number: 12,
      fileName: "lote-xii.pdf",
      label: "Lote XII",
    });
  });

  it("mezcla esquemas: sigue la numeración de los legacy y de los nuevos", () => {
    expect(suggestNextLot([...legacyNames, "lote-xii.pdf"]).fileName).toBe("lote-xiii.pdf");
    expect(suggestNextLot([]).fileName).toBe("lote-i.pdf");
    expect(suggestNextLot([fileNameForLot(3), fileNameForLot(14)]).number).toBe(15);
  });

  it("los nombres sugeridos y los legacy pasan la validación de la base y la ruta", () => {
    for (const name of [...legacyNames, fileNameForLot(12), fileNameForLot(388)]) {
      expect(isValidFileName(name), name).toBe(true);
    }
    for (const bad of ["../x.pdf", "a/b.pdf", "Lote XII.pdf", "x.PDF", "-x.pdf"]) {
      expect(isValidFileName(bad), bad).toBe(false);
    }
  });

  it("la URL del QR es siempre la de producción, con el prefijo de cada documento", () => {
    expect(publicPdfUrl("lote-xii.pdf", "coa")).toBe("https://ankor-bio.com/coa/lote-xii.pdf");
    expect(publicPdfUrl("AnkorBiosciences-COA-LoteXI-PDFforQrCode.pdf", "private-info")).toBe(
      "https://ankor-bio.com/private-info/AnkorBiosciences-COA-LoteXI-PDFforQrCode.pdf",
    );
    expect(publicPdfPath("lote-xii.pdf", NEW_LOT_PREFIX)).toBe("/coa/lote-xii.pdf");
  });

  it("la URL nueva es bastante más corta (QR menos denso)", () => {
    const nueva = publicPdfUrl(fileNameForLot(12), "coa");
    const vieja = publicPdfUrl("AnkorBiosciences-COA-LoteXII-PDFforQrCode.pdf", "private-info");
    expect(nueva.length).toBeLessThan(vieja.length / 2);
  });
});

describe("QR", () => {
  const name = "lote-xii.pdf";

  it("SVG válido", async () => {
    const svg = await qrSvg(name, "coa");
    expect(svg.startsWith("<svg")).toBe(true);
    expect(svg).toContain("viewBox");
  });

  it("PNG de 2048 px", async () => {
    const png = await qrPng(name, "coa");
    expect(png.subarray(1, 4).toString("latin1")).toBe("PNG");
    expect(png.readUInt32BE(16)).toBe(QR_PNG_SIZE); // ancho (IHDR)
    expect(png.readUInt32BE(20)).toBe(QR_PNG_SIZE); // alto
  });

  it("nombre de descarga", () => {
    expect(qrDownloadName(name, "svg")).toBe("QR-lote-xii.svg");
    expect(qrDownloadName(name, "png")).toBe("QR-lote-xii.png");
    expect(qrDownloadName("AnkorBiosciences-COA-LoteXI-PDFforQrCode.pdf", "svg")).toBe(
      "QR-AnkorBiosciences-COA-LoteXI.svg",
    );
  });
});
