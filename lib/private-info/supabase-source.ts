import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { cacheLife, cacheTag } from "next/cache";
import type { PdfSource, PublishedPdf } from "./types";

/**
 * Fuente de producción: Postgres (documents + document_versions) y Storage
 * (bucket privado coa-pdfs). Usa la service role key: solo corre en el
 * servidor y nunca expone URLs del bucket.
 *
 * Esquema según docs/spec.md ("Modelo de datos"). Si la migración de la
 * tarea 3 cambia nombres de columnas, ajustar acá y en import-legacy.ts.
 */

export const PDF_BUCKET = "coa-pdfs";

/** Tag de caché por documento. Al publicar: revalidateTag(documentTag(fileName)). */
export const documentTag = (fileName: string) => `private-info:${fileName}`;

let client: SupabaseClient | null = null;

function supabase(): SupabaseClient {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.");
  }
  client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}

type PublishedRow = {
  fileName: string;
  versionId: string;
  sha256: string;
  size: number;
  pdfPath: string;
};

/**
 * Busca la versión publicada. Cacheada por documento: publicar invalida el tag
 * y la próxima request ve la versión nueva en el acto. Los errores no se
 * cachean (se lanzan antes de devolver).
 */
async function findPublished(fileName: string): Promise<PublishedRow | null> {
  "use cache";
  cacheTag(documentTag(fileName));
  cacheLife("days");

  const db = supabase();
  const { data: doc, error } = await db
    .from("documents")
    .select("id, file_name, published_version_id")
    .eq("file_name", fileName)
    .maybeSingle();
  if (error) throw new Error(`documents: ${error.message}`);
  if (!doc || !doc.published_version_id) return null;

  const { data: version, error: vError } = await db
    .from("document_versions")
    .select("id, pdf_path, sha256, size_bytes")
    .eq("id", doc.published_version_id)
    .single();
  if (vError) throw new Error(`document_versions: ${vError.message}`);

  return {
    fileName: doc.file_name,
    versionId: version.id,
    sha256: version.sha256,
    size: version.size_bytes,
    pdfPath: version.pdf_path,
  };
}

export const supabaseSource: PdfSource = {
  async getPublished(fileName): Promise<PublishedPdf | null> {
    const row = await findPublished(fileName);
    if (!row) return null;
    return {
      fileName: row.fileName,
      versionId: row.versionId,
      sha256: row.sha256,
      size: row.size,
      read: async () => {
        const { data, error } = await supabase().storage.from(PDF_BUCKET).download(row.pdfPath);
        if (error || !data) throw new Error(`storage: ${error?.message ?? "sin datos"}`);
        return new Uint8Array(await data.arrayBuffer());
      },
    };
  },
};
