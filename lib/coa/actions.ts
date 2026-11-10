"use server";

import { redirect } from "next/navigation";
import type { FormState } from "@/lib/auth/actions";
import { requireRole } from "@/lib/auth/session";
import { publishCoa, publishUploadedPdf, republishVersion, saveDraft } from "./service";

/** Acciones del editor de COAs. Cada una vuelve a verificar el rol. */

async function editor() {
  const { user, allowed } = await requireRole();
  return allowed ? user : null;
}

const UUID = /^[0-9a-f-]{36}$/i;

export type DraftResult =
  { ok: true; version: number; savedAt: string } | { ok: false; message: string };

export async function saveDraftAction(documentId: string, data: unknown): Promise<DraftResult> {
  const user = await editor();
  if (!user) return { ok: false, message: "No tenés permiso para editar COAs." };
  if (!UUID.test(documentId)) return { ok: false, message: "Lote inválido." };
  const result = await saveDraft(documentId, user.id, data);
  return result.ok
    ? { ok: true, version: result.value.version, savedAt: new Date().toISOString() }
    : result;
}

export async function publishAction(
  documentId: string,
  data: unknown,
): Promise<{ ok: false; message: string } | never> {
  const user = await editor();
  if (!user) return { ok: false, message: "No tenés permiso para publicar." };
  if (!UUID.test(documentId)) return { ok: false, message: "Lote inválido." };
  const result = await publishCoa(documentId, user.id, data);
  if (!result.ok) return result;
  redirect(`/admin/lotes/${documentId}?publicado=${result.value.version}`);
}

export async function republishAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await editor();
  if (!user) return { status: "error", message: "No tenés permiso." };
  const documentId = String(formData.get("documentId") ?? "");
  const versionId = String(formData.get("versionId") ?? "");
  if (!UUID.test(documentId) || !UUID.test(versionId)) {
    return { status: "error", message: "Datos inválidos." };
  }
  const result = await republishVersion(documentId, user.id, versionId);
  if (!result.ok) return { status: "error", message: result.message };
  redirect(`/admin/lotes/${documentId}?publicado=${result.value.version}`);
}

export async function uploadPdfAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await editor();
  if (!user) return { status: "error", message: "No tenés permiso." };
  const documentId = String(formData.get("documentId") ?? "");
  const file = formData.get("pdf");
  if (!UUID.test(documentId)) return { status: "error", message: "Lote inválido." };
  if (!(file instanceof File) || file.size === 0) {
    return {
      status: "error",
      message: "Elegí un archivo PDF.",
      fieldErrors: { pdf: "Elegí un archivo PDF." },
    };
  }
  if (formData.get("confirm") !== "on") {
    return {
      status: "error",
      message: "Confirmá la publicación.",
      fieldErrors: { confirm: "Confirmá que revisaste el PDF: va a quedar publicado en la URL." },
    };
  }
  const result = await publishUploadedPdf(documentId, user.id, file);
  if (!result.ok) return { status: "error", message: result.message };
  redirect(`/admin/lotes/${documentId}?publicado=${result.value.version}`);
}
