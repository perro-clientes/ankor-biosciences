import type { PdfSource } from "./types";

/**
 * Lógica de /private-info/[file], separada de Next para poder testearla.
 *
 * REGLA INMUTABLE: toda URL de inventory.json debe responder 200,
 * application/pdf y el mismo SHA-256. Cualquier cambio acá necesita que pasen
 * `pnpm test` y `pnpm verify:urls`.
 *
 * - Responde el PDF (nunca un redirect): la URL que ve el usuario no cambia.
 * - file_name exacto y case-sensitive, como Apache en el cPanel.
 * - 404 si no existe; 503 si la fuente falla (para no cachear un 404 falso).
 */

/** Nombres válidos: los 12 legacy y los que cree el panel cumplen este patrón. */
const FILE_NAME = /^[A-Za-z0-9][A-Za-z0-9._-]{0,199}\.pdf$/;

export function isValidFileName(fileName: string): boolean {
  return FILE_NAME.test(fileName) && !fileName.includes("..");
}

// El navegador revalida siempre (ETag = SHA-256), así una versión nueva se ve
// apenas se publica. Sin caché en la CDN por ahora: ver nota en route.ts.
const CACHE_OK = "public, max-age=0, must-revalidate";
const CACHE_NONE = "no-store";

function notFound(): Response {
  return new Response("Not found", {
    status: 404,
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": CACHE_NONE },
  });
}

export async function handlePrivateInfo(
  request: Request,
  fileName: string,
  source: PdfSource,
): Promise<Response> {
  if (!isValidFileName(fileName)) return notFound();

  let pdf;
  try {
    pdf = await source.getPublished(fileName);
  } catch (error) {
    console.error(`[private-info] Fuente no disponible para ${fileName}:`, error);
    return new Response("Service unavailable", {
      status: 503,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": CACHE_NONE,
        "Retry-After": "30",
      },
    });
  }
  if (!pdf || pdf.fileName !== fileName) return notFound();

  const etag = `"${pdf.sha256}"`;
  const headers = new Headers({
    "Content-Type": "application/pdf",
    "Content-Disposition": `inline; filename="${pdf.fileName}"`,
    "Content-Length": String(pdf.size),
    ETag: etag,
    "Cache-Control": CACHE_OK,
    "X-Content-Type-Options": "nosniff",
  });

  const ifNoneMatch = request.headers.get("if-none-match");
  if (ifNoneMatch && ifNoneMatch.split(",").some((t) => t.trim() === etag)) {
    headers.delete("Content-Length");
    return new Response(null, { status: 304, headers });
  }

  if (request.method === "HEAD") {
    return new Response(null, { status: 200, headers });
  }

  let body: Uint8Array;
  try {
    body = await pdf.read();
  } catch (error) {
    console.error(`[private-info] No se pudo leer ${fileName} (${pdf.versionId}):`, error);
    return new Response("Service unavailable", {
      status: 503,
      headers: { "Cache-Control": CACHE_NONE, "Retry-After": "30" },
    });
  }

  headers.set("Content-Length", String(body.byteLength));
  return new Response(body as BodyInit, { status: 200, headers });
}
