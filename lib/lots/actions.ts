"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { FormState } from "@/lib/auth/actions";
import { requireRole } from "@/lib/auth/session";
import { renderPlaceholderPdf } from "@/lib/pdf/render";
import { PDF_BUCKET, documentTag } from "@/lib/private-info/supabase-source";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NEW_LOT_PREFIX, isValidFileName } from "./naming";

const createLotSchema = z.object({
  fileName: z
    .string()
    .trim()
    .max(200, "El nombre es demasiado largo.")
    .refine(isValidFileName, "Solo letras, números, guiones, puntos y “_”, terminado en .pdf."),
  label: z.string().trim().min(1, "Poné una etiqueta (ej. Lote XII).").max(60),
});

/**
 * Crea un lote: documento + PDF placeholder publicado como versión 1.
 * Desde ese momento la URL /coa/<file_name> responde y el QR se puede imprimir.
 * file_name y url_prefix quedan bloqueados para siempre (trigger en la base).
 */
export async function createLot(_prev: FormState, formData: FormData): Promise<FormState> {
  const { user, allowed } = await requireRole();
  if (!allowed) return { status: "error", message: "No tenés permiso para crear lotes." };

  const parsed = createLotSchema.safeParse({
    fileName: formData.get("fileName"),
    label: formData.get("label"),
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) fieldErrors[String(i.path[0])] ??= i.message;
    return { status: "error", message: "Revisá los datos.", fieldErrors };
  }
  if (formData.get("confirm") !== "on") {
    return {
      status: "error",
      message: "Confirmá que revisaste el nombre.",
      fieldErrors: { confirm: "Confirmá que revisaste el nombre: después no se puede cambiar." },
    };
  }
  const { fileName, label } = parsed.data;

  const supabase = await createSupabaseServerClient();
  const admin = createSupabaseAdminClient();

  // 1. Documento (RLS: editores y admins pueden crear).
  const { data: doc, error: docError } = await supabase
    .from("documents")
    .insert({
      file_name: fileName,
      url_prefix: NEW_LOT_PREFIX,
      label,
      kind: "template",
      status: "pendiente",
      created_by: user.id,
    })
    .select("id")
    .single();
  if (docError) {
    if (docError.code === "23505") {
      return {
        status: "error",
        message: "Ya existe un lote con ese nombre.",
        fieldErrors: { fileName: "Ya existe un lote con ese nombre de archivo." },
      };
    }
    console.error("[lots] insert document:", docError.message);
    return { status: "error", message: "No se pudo crear el lote." };
  }

  // 2. Placeholder → Storage (bucket privado: solo la service role escribe).
  const pdfPath = `documents/${doc.id}/v1.pdf`;
  try {
    const pdf = await renderPlaceholderPdf(label);
    const { error: upError } = await admin.storage
      .from(PDF_BUCKET)
      .upload(pdfPath, pdf.bytes, { contentType: "application/pdf", upsert: false });
    if (upError) throw new Error(`storage: ${upError.message}`);

    // 3. Versión 1 publicada + puntero del documento.
    const { data: version, error: vError } = await supabase
      .from("document_versions")
      .insert({
        document_id: doc.id,
        version: 1,
        pdf_path: pdfPath,
        sha256: pdf.sha256,
        size_bytes: pdf.size,
        created_by: user.id,
        published_at: new Date().toISOString(),
        published_by: user.id,
      })
      .select("id")
      .single();
    if (vError) throw new Error(`document_versions: ${vError.message}`);

    const { error: pubError } = await supabase
      .from("documents")
      .update({ published_version_id: version.id })
      .eq("id", doc.id);
    if (pubError) throw new Error(`publish: ${pubError.message}`);

    await supabase.from("audit_log").insert({
      actor: user.id,
      action: "lot_create",
      document_id: doc.id,
      version_id: version.id,
      details: { file_name: fileName, url_prefix: NEW_LOT_PREFIX, label, placeholder: true },
    });
  } catch (error) {
    // Deshacer lo posible. Si la versión llegó a crearse, la base no deja borrarla
    // (regla: las versiones nunca se borran) y el lote queda pendiente sin publicar.
    console.error("[lots] create:", error);
    await admin.storage.from(PDF_BUCKET).remove([pdfPath]);
    const { error: delError } = await admin.from("documents").delete().eq("id", doc.id);
    if (delError) console.error("[lots] cleanup:", delError.message);
    return { status: "error", message: "No se pudo generar el PDF del lote. Probá de nuevo." };
  }

  // Si alguien pidió la URL antes de crearse el lote, no queda cacheado el 404.
  updateTag(documentTag(fileName));
  redirect(`/admin/lotes/${doc.id}?creado=1`);
}
