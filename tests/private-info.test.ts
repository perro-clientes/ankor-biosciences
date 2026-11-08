/**
 * Tests de /private-info/[file]. Si algo de esto falla, se rompen QR impresos.
 * La fuente en memoria se arma con los PDFs reales de legacy/private-info/.
 */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { handlePrivateInfo, isValidFileName } from "@/lib/private-info/handler";
import type { PdfSource, PublishedPdf } from "@/lib/private-info/types";
import inventory from "../inventory.json";

type Entry = (typeof inventory.files)[number];

const legacyDir = join(__dirname, "..", "legacy", "private-info");
const sha256 = (bytes: Uint8Array) => createHash("sha256").update(bytes).digest("hex");

function memorySource(entries: Entry[]): PdfSource & { calls: string[] } {
  const calls: string[] = [];
  return {
    calls,
    async getPublished(fileName) {
      calls.push(fileName);
      const entry = entries.find((e) => e.fileName === fileName);
      if (!entry) return null;
      const bytes = new Uint8Array(readFileSync(join(legacyDir, entry.fileName)));
      return {
        fileName: entry.fileName,
        versionId: `v1-${entry.fileName}`,
        sha256: sha256(bytes),
        size: bytes.byteLength,
        read: async () => bytes,
      };
    },
  };
}

const get = (path: string, init?: RequestInit) =>
  new Request(`https://ankor-bio.com/private-info/${path}`, init);

describe("inventory.json", () => {
  it("tiene las 12 URLs de QR impresos y coincide con legacy/", () => {
    expect(inventory.files).toHaveLength(12);
    for (const entry of inventory.files) {
      const bytes = readFileSync(join(legacyDir, entry.fileName));
      expect(bytes.byteLength, entry.fileName).toBe(entry.bytes);
      expect(sha256(bytes), entry.fileName).toBe(entry.sha256);
      expect(entry.path).toBe(`/private-info/${entry.fileName}`);
    }
  });
});

describe("GET /private-info/[file]", () => {
  const source = memorySource(inventory.files);

  it.each(inventory.files.map((e) => [e.fileName, e] as const))(
    "%s → 200, application/pdf y el mismo SHA-256",
    async (fileName, entry) => {
      const res = await handlePrivateInfo(get(fileName), fileName, source);
      expect(res.status).toBe(200);
      expect(res.headers.get("content-type")).toBe("application/pdf");
      expect(res.headers.get("content-disposition")).toBe(`inline; filename="${fileName}"`);
      expect(res.headers.get("location")).toBeNull();
      const body = new Uint8Array(await res.arrayBuffer());
      expect(body.byteLength).toBe(entry.bytes);
      expect(sha256(body)).toBe(entry.sha256);
      expect(res.headers.get("etag")).toBe(`"${entry.sha256}"`);
      expect(res.headers.get("content-length")).toBe(String(entry.bytes));
    },
  );

  it("distingue mayúsculas, como Apache en el cPanel", async () => {
    const name = "AnkorBiosciences-COA-LoteX-PDFforQrCode.pdf";
    for (const variant of [name.toLowerCase(), name.toUpperCase(), name.replace(".pdf", ".PDF")]) {
      const res = await handlePrivateInfo(get(variant), variant, source);
      expect(res.status, variant).toBe(404);
    }
  });

  it("404 para un archivo que no existe", async () => {
    const name = "AnkorBiosciences-COA-LoteXCIX-PDFforQrCode.pdf";
    const res = await handlePrivateInfo(get(name), name, source);
    expect(res.status).toBe(404);
    expect(res.headers.get("cache-control")).toBe("no-store");
  });

  it("404 sin consultar la fuente para nombres inválidos o con path traversal", async () => {
    const spy = memorySource(inventory.files);
    const bad = [
      "",
      "..",
      "../etc/passwd",
      "a/b.pdf",
      "..%2Fsecret.pdf",
      ".env",
      "x.txt",
      "x.pdf\n",
    ];
    for (const name of bad) {
      expect(isValidFileName(name), JSON.stringify(name)).toBe(false);
      const res = await handlePrivateInfo(get("x"), name, spy);
      expect(res.status).toBe(404);
    }
    expect(spy.calls).toHaveLength(0);
  });

  it("404 si la base devuelve otro file_name (p. ej. una búsqueda case-insensitive)", async () => {
    const real = inventory.files[0];
    const sloppy: PdfSource = {
      getPublished: async () => ({
        ...((await source.getPublished(real.fileName)) as PublishedPdf),
      }),
    };
    const asked = real.fileName.toLowerCase();
    const res = await handlePrivateInfo(get(asked), asked, sloppy);
    expect(res.status).toBe(404);
  });

  it("503 sin caché si la fuente no responde (no un 404 falso)", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const down: PdfSource = {
      getPublished: async () => {
        throw new Error("timeout");
      },
    };
    const name = inventory.files[0].fileName;
    const res = await handlePrivateInfo(get(name), name, down);
    expect(res.status).toBe(503);
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(res.headers.get("retry-after")).toBe("30");
  });

  it("503 si falla la descarga del PDF", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const entry = inventory.files[0];
    const broken: PdfSource = {
      getPublished: async () => ({
        fileName: entry.fileName,
        versionId: "v1",
        sha256: entry.sha256,
        size: entry.bytes,
        read: async () => {
          throw new Error("storage down");
        },
      }),
    };
    const res = await handlePrivateInfo(get(entry.fileName), entry.fileName, broken);
    expect(res.status).toBe(503);
  });

  it("HEAD responde los mismos headers sin cuerpo", async () => {
    const entry = inventory.files[0];
    const res = await handlePrivateInfo(
      get(entry.fileName, { method: "HEAD" }),
      entry.fileName,
      source,
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("application/pdf");
    expect(res.headers.get("content-length")).toBe(String(entry.bytes));
    expect(res.body).toBeNull();
  });

  it("304 cuando el navegador ya tiene esa versión (ETag)", async () => {
    const entry = inventory.files[0];
    const res = await handlePrivateInfo(
      get(entry.fileName, { headers: { "If-None-Match": `"${entry.sha256}"` } }),
      entry.fileName,
      source,
    );
    expect(res.status).toBe(304);
    expect(res.body).toBeNull();
  });

  it("200 con el PDF nuevo cuando cambió la versión publicada", async () => {
    const entry = inventory.files[0];
    const res = await handlePrivateInfo(
      get(entry.fileName, { headers: { "If-None-Match": `"una-version-vieja"` } }),
      entry.fileName,
      source,
    );
    expect(res.status).toBe(200);
  });
});
