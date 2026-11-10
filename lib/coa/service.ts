import "server-only";

import { updateTag } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { DEFAULT_FOOTNOTES } from "@/lib/pdf/coa-defaults";
import { describeIssues, coaSchema, isCoaDoc, type CoaDoc } from "@/lib/pdf/coa-schema";
import { renderCoaPdf } from "@/lib/pdf/render";
import { PDF_BUCKET, documentTag } from "@/lib/private-info/supabase-source";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Operaciones sobre las versiones de un COA. Llamar SIEMPRE después de
 * requireRole() (las acciones en lib/coa/actions.ts lo hacen).
 *
 * - Lecturas y escrituras de tablas: con la sesión del usuario (RLS).
 * - Storage: con la service role (bucket privado sin políticas).
 * - Reglas de la base: las versiones nunca se borran y una publicada no se
 *   modifica; corregir = publicar una versión nueva.
 */

export type ServiceResult<T = undefined> =
  ({ ok: true } & (T extends undefined ? object : { value: T })) | { ok: false; message: string };

type DocRow = { id: string; file_name: string; kind: string; status: string };
type VersionRow = {
  id: string;
  version: number;
  data: unknown;
  published_at: string | null;
};

/** Límite de "Subir PDF": Vercel corta los requests a ~4,5 MB. */
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

async function loadDoc(db: SupabaseClient, documentId: string) {
  const { data, error } = await db
    .from("documents")
    .select("id, file_name, kind, status")
    .eq("id", documentId)
    .maybeSingle<DocRow>();
  if (error) throw new Error(`documents: ${error.message}`);
  return data;
}

async function versions(db: SupabaseClient, documentId: string) {
  const { data, error } = await db
    .from("document_versions")
    .select("id, version, data, published_at")
    .eq("document_id", documentId)
    .order("version", { ascending: false })
    .returns<VersionRow[]>();
  if (error) throw new Error(`document_versions: ${error.message}`);
  return data;
}

/** Plantilla activa (notas al pie). Si no hay, la de fábrica. */
export async function activeTemplate(db?: SupabaseClient) {
  const client = db ?? (await createSupabaseServerClient());
  const { data } = await client
    .from("templates")
    .select("version, footnotes")
    .eq("active", true)
    .maybeSingle<{ version: number; footnotes: string }>();
  return { version: data?.version ?? null, footnotes: data?.footnotes || DEFAULT_FOOTNOTES };
}

/**
 * Estado del editor: el borrador (si hay) o, si no, el COA de la última versión
 * publicada con datos, para corregir partiendo de lo publicado. Si no hay
 * ninguno, `data` es null y el panel ofrece arrancar de la plantilla base o
 * copiar la estructura de otro lote. Los borradores del formato anterior
 * (formulario fijo) se ignoran.
 */
export async function editorState(documentId: string) {
  const db = await createSupabaseServerClient();
  const doc = await loadDoc(db, documentId);
  if (!doc) return null;
  const all = await versions(db, documentId);
  const draft = all.find((v) => v.published_at === null) ?? null;
  const lastWithData = all.find((v) => v.published_at !== null && isCoaDoc(v.data)) ?? null;
  const draftData = draft && isCoaDoc(draft.data) ? draft.data : null;
  return {
    doc,
    draftVersion: draft?.version ?? null,
    nextVersion: (all[0]?.version ?? 0) + (draft ? 0 : 1),
    data: (draftData ?? (lastWithData?.data as CoaDoc | undefined) ?? null) as CoaDoc | null,
    source: draftData ? ("borrador" as const) : lastWithData ? ("publicado" as const) : null,
  };
}

export type CoaSource = { documentId: string; label: string; version: number; publishedAt: string };

/** Lotes con un COA publicado en el formato por bloques (para "Copiar estructura"). */
export async function listCoaSources(excludeId?: string): Promise<CoaSource[]> {
  const db = await createSupabaseServerClient();
  const { data, error } = await db
    .from("document_versions")
    // Hay dos relaciones entre las tablas (versión → documento y documento →
    // versión publicada): se nombra la que va de la versión a su documento.
    .select(
      "document_id, version, published_at, documents!document_versions_document_id_fkey!inner(label)",
    )
    .not("published_at", "is", null)
    .eq("data->>format", "2")
    .order("published_at", { ascending: false })
    .returns<
      { document_id: string; version: number; published_at: string; documents: { label: string } }[]
    >();
  if (error) throw new Error(`document_versions: ${error.message}`);
  const seen = new Set<string>();
  const out: CoaSource[] = [];
  for (const row of data) {
    if (row.document_id === excludeId || seen.has(row.document_id)) continue;
    seen.add(row.document_id);
    out.push({
      documentId: row.document_id,
      label: row.documents.label,
      version: row.version,
      publishedAt: row.published_at,
    });
  }
  return out;
}

/** COA (formato por bloques) de la última versión publicada de un lote. */
export async function latestPublishedCoa(documentId: string): Promise<CoaDoc | null> {
  const db = await createSupabaseServerClient();
  const all = await versions(db, documentId);
  const found = all.find((v) => v.published_at !== null && isCoaDoc(v.data));
  return (found?.data as CoaDoc | undefined) ?? null;
}

/** Devuelve la fila de borrador (la crea si no existe). */
async function ensureDraft(db: SupabaseClient, documentId: string, userId: string) {
  const all = await versions(db, documentId);
  const draft = all.find((v) => v.published_at === null);
  if (draft) return draft;
  const { data, error } = await db
    .from("document_versions")
    .insert({ document_id: documentId, version: (all[0]?.version ?? 0) + 1, created_by: userId })
    .select("id, version, data, published_at")
    .single<VersionRow>();
  if (error) throw new Error(`document_versions: ${error.message}`);
  return data;
}

async function audit(
  db: SupabaseClient,
  actor: string,
  action: string,
  documentId: string,
  versionId: string | null,
  details: Record<string, unknown>,
) {
  const { error } = await db
    .from("audit_log")
    .insert({ actor, action, document_id: documentId, version_id: versionId, details });
  if (error) console.error("[audit]", action, error.message);
}

/** Guarda el borrador tal como esté (puede estar incompleto). No cambia la URL. */
export async function saveDraft(
  documentId: string,
  userId: string,
  data: unknown,
): Promise<ServiceResult<{ version: number }>> {
  if (JSON.stringify(data ?? null).length > 200_000) {
    return { ok: false, message: "El borrador es demasiado grande." };
  }
  const db = await createSupabaseServerClient();
  const doc = await loadDoc(db, documentId);
  if (!doc) return { ok: false, message: "Lote no encontrado." };

  const draft = await ensureDraft(db, documentId, userId);
  const { error } = await db.from("document_versions").update({ data }).eq("id", draft.id);
  if (error) return { ok: false, message: `No se pudo guardar: ${error.message}` };
  if (doc.status === "pendiente") {
    await db.from("documents").update({ status: "borrador" }).eq("id", documentId);
  }
  return { ok: true, value: { version: draft.version } };
}

/**
 * Publica el COA: valida, genera el PDF con la plantilla activa, lo sube y lo
 * deja como versión publicada. La URL muestra el PDF nuevo en el acto.
 */
export async function publishCoa(
  documentId: string,
  userId: string,
  input: unknown,
): Promise<ServiceResult<{ version: number }>> {
  const parsed = coaSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: describeIssues(parsed.error.issues).slice(0, 3).join(" · ") };
  }

  const db = await createSupabaseServerClient();
  const admin = createSupabaseAdminClient();
  const doc = await loadDoc(db, documentId);
  if (!doc) return { ok: false, message: "Lote no encontrado." };

  const template = await activeTemplate(db);
  const pdf = await renderCoaPdf({ data: parsed.data });
  const draft = await ensureDraft(db, documentId, userId);
  const pdfPath = `documents/${documentId}/v${draft.version}.pdf`;

  // upsert: la versión todavía no está publicada; si un intento anterior subió
  // el archivo y falló después, se reemplaza.
  const { error: upError } = await admin.storage
    .from(PDF_BUCKET)
    .upload(pdfPath, pdf.bytes, { contentType: "application/pdf", upsert: true });
  if (upError) return { ok: false, message: `No se pudo subir el PDF: ${upError.message}` };

  const { error: vError } = await db
    .from("document_versions")
    .update({
      data: parsed.data,
      template_version: template.version,
      pdf_path: pdfPath,
      sha256: pdf.sha256,
      size_bytes: pdf.size,
      published_at: new Date().toISOString(),
      published_by: userId,
    })
    .eq("id", draft.id);
  if (vError) return { ok: false, message: `No se pudo publicar: ${vError.message}` };

  const { error: dError } = await db
    .from("documents")
    .update({ published_version_id: draft.id, status: "publicado" })
    .eq("id", documentId);
  if (dError) return { ok: false, message: `No se pudo publicar: ${dError.message}` };

  await audit(db, userId, "publish", documentId, draft.id, {
    file_name: doc.file_name,
    version: draft.version,
    sha256: pdf.sha256,
    lot: parsed.data.header.find((l) => /lot/i.test(l.label))?.value ?? null,
  });
  updateTag(documentTag(doc.file_name));
  return { ok: true, value: { version: draft.version } };
}

/** Vuelve a poner en la URL una versión publicada anterior. */
export async function republishVersion(
  documentId: string,
  userId: string,
  versionId: string,
): Promise<ServiceResult<{ version: number }>> {
  const db = await createSupabaseServerClient();
  const doc = await loadDoc(db, documentId);
  if (!doc) return { ok: false, message: "Lote no encontrado." };
  const target = (await versions(db, documentId)).find((v) => v.id === versionId);
  if (!target || !target.published_at) {
    return { ok: false, message: "Esa versión no está publicada." };
  }

  // Placeholder inicial de un lote nuevo (v1 sin datos) → el lote vuelve a "pendiente".
  const isPlaceholder = doc.kind === "template" && target.version === 1 && !target.data;
  const { error } = await db
    .from("documents")
    .update({ published_version_id: target.id, status: isPlaceholder ? "pendiente" : "publicado" })
    .eq("id", documentId);
  if (error) return { ok: false, message: `No se pudo cambiar la versión: ${error.message}` };

  await audit(db, userId, "republish", documentId, target.id, {
    file_name: doc.file_name,
    version: target.version,
  });
  updateTag(documentTag(doc.file_name));
  return { ok: true, value: { version: target.version } };
}

/**
 * Plan B: publica un PDF hecho a mano como versión nueva. Si había un borrador
 * del formulario, esa fila se usa para el PDF subido (el borrador se descarta).
 */
export async function publishUploadedPdf(
  documentId: string,
  userId: string,
  file: File,
): Promise<ServiceResult<{ version: number }>> {
  if (file.size === 0) return { ok: false, message: "El archivo está vacío." };
  if (file.size > MAX_UPLOAD_BYTES) return { ok: false, message: "El PDF supera los 4 MB." };
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (Buffer.from(bytes.subarray(0, 5)).toString("latin1") !== "%PDF-") {
    return { ok: false, message: "El archivo no es un PDF." };
  }

  const db = await createSupabaseServerClient();
  const admin = createSupabaseAdminClient();
  const doc = await loadDoc(db, documentId);
  if (!doc) return { ok: false, message: "Lote no encontrado." };

  const draft = await ensureDraft(db, documentId, userId);
  const pdfPath = `documents/${documentId}/v${draft.version}.pdf`;
  const { error: upError } = await admin.storage
    .from(PDF_BUCKET)
    .upload(pdfPath, bytes, { contentType: "application/pdf", upsert: true });
  if (upError) return { ok: false, message: `No se pudo subir el PDF: ${upError.message}` };

  const { createHash } = await import("node:crypto");
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  const { error: vError } = await db
    .from("document_versions")
    .update({
      data: null,
      template_version: null,
      pdf_path: pdfPath,
      sha256,
      size_bytes: bytes.byteLength,
      published_at: new Date().toISOString(),
      published_by: userId,
    })
    .eq("id", draft.id);
  if (vError) return { ok: false, message: `No se pudo publicar: ${vError.message}` };

  const { error: dError } = await db
    .from("documents")
    .update({ published_version_id: draft.id, status: "publicado" })
    .eq("id", documentId);
  if (dError) return { ok: false, message: `No se pudo publicar: ${dError.message}` };

  await audit(db, userId, "publish_upload", documentId, draft.id, {
    file_name: doc.file_name,
    version: draft.version,
    sha256,
    original_name: file.name,
  });
  updateTag(documentTag(doc.file_name));
  return { ok: true, value: { version: draft.version } };
}

/** Bytes del PDF de una versión (para verla desde el panel). */
export async function versionPdf(documentId: string, version: number) {
  const db = await createSupabaseServerClient();
  const { data } = await db
    .from("document_versions")
    .select("pdf_path")
    .eq("document_id", documentId)
    .eq("version", version)
    .maybeSingle<{ pdf_path: string | null }>();
  if (!data?.pdf_path) return null;
  const { data: blob, error } = await createSupabaseAdminClient()
    .storage.from(PDF_BUCKET)
    .download(data.pdf_path);
  if (error || !blob) return null;
  return new Uint8Array(await blob.arrayBuffer());
}
