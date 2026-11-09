import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { UrlPrefix } from "./naming";

/**
 * Lecturas de lotes con la sesión del usuario (RLS: solo editores y admins).
 * Llamar dentro de <Suspense> y después de requireRole().
 */

export type LotStatus = "pendiente" | "borrador" | "publicado";
export type LotKind = "legacy" | "template" | "upload";

export type LotSummary = {
  id: string;
  fileName: string;
  urlPrefix: UrlPrefix;
  label: string;
  kind: LotKind;
  status: LotStatus;
  createdAt: string;
  publishedVersion: number | null;
  publishedAt: string | null;
};

export type LotVersion = {
  id: string;
  version: number;
  publishedAt: string | null;
  sizeBytes: number | null;
  sha256: string | null;
  hasData: boolean;
};

export type LotDetail = LotSummary & {
  publishedVersionId: string | null;
  versions: LotVersion[];
};

type DocRow = {
  id: string;
  file_name: string;
  url_prefix: UrlPrefix;
  label: string;
  kind: LotKind;
  status: LotStatus;
  created_at: string;
  published_version_id: string | null;
  published: { version: number; published_at: string | null } | null;
};

const DOC_COLUMNS =
  "id, file_name, url_prefix, label, kind, status, created_at, published_version_id, published:document_versions!documents_published_version_fk(version, published_at)";

function toSummary(row: DocRow): LotSummary {
  return {
    id: row.id,
    fileName: row.file_name,
    urlPrefix: row.url_prefix,
    label: row.label,
    kind: row.kind,
    status: row.status,
    createdAt: row.created_at,
    publishedVersion: row.published?.version ?? null,
    publishedAt: row.published?.published_at ?? null,
  };
}

/**
 * Fecha para ordenar: los legacy se importaron todos juntos, así que para ellos
 * cuenta la fecha original de publicación; para el resto, la de creación.
 */
function sortDate(lot: LotSummary): string {
  return (lot.kind === "legacy" ? lot.publishedAt : lot.createdAt) ?? lot.createdAt;
}

/** Todos los lotes, los más nuevos primero. */
export async function listLots(): Promise<LotSummary[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("documents").select(DOC_COLUMNS).returns<DocRow[]>();
  if (error) throw new Error(`documents: ${error.message}`);
  return data.map(toSummary).sort((x, y) => sortDate(y).localeCompare(sortDate(x)));
}

export async function listFileNames(): Promise<string[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("documents").select("file_name");
  if (error) throw new Error(`documents: ${error.message}`);
  return data.map((d) => d.file_name as string);
}

export async function getLot(id: string): Promise<LotDetail | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const supabase = await createSupabaseServerClient();
  const { data: row, error } = await supabase
    .from("documents")
    .select(DOC_COLUMNS)
    .eq("id", id)
    .returns<DocRow[]>()
    .maybeSingle();
  if (error) throw new Error(`documents: ${error.message}`);
  if (!row) return null;

  const { data: versions, error: vError } = await supabase
    .from("document_versions")
    .select("id, version, published_at, size_bytes, sha256, data")
    .eq("document_id", id)
    .order("version", { ascending: false });
  if (vError) throw new Error(`document_versions: ${vError.message}`);

  return {
    ...toSummary(row),
    publishedVersionId: row.published_version_id,
    versions: versions.map((v) => ({
      id: v.id,
      version: v.version,
      publishedAt: v.published_at,
      sizeBytes: v.size_bytes,
      sha256: v.sha256,
      hasData: v.data !== null,
    })),
  };
}
