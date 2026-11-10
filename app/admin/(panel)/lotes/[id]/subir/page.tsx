import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ChevronLeft } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { editorState } from "@/lib/coa/service";
import { NoAccess } from "@/components/admin/no-access";
import { UploadForm } from "./upload-form";

export const metadata: Metadata = { title: "Subir PDF" };

export default function UploadPage(props: PageProps<"/admin/lotes/[id]/subir">) {
  return (
    <Suspense fallback={<p className="text-body-sm text-ink-muted">Cargando…</p>}>
      <Upload {...props} />
    </Suspense>
  );
}

async function Upload({ params }: PageProps<"/admin/lotes/[id]/subir">) {
  const { user, allowed } = await requireRole();
  if (!allowed) return <NoAccess email={user.email} />;
  const { id } = await params;
  const state = await editorState(id);
  if (!state) notFound();

  return (
    <div className="flex flex-col gap-6">
      <Link
        href={`/admin/lotes/${id}`}
        className="inline-flex min-h-target items-center gap-1 self-start text-sm text-ink-muted hover:text-brand-ink"
      >
        <ChevronLeft aria-hidden="true" className="size-4" />
        Volver al lote
      </Link>
      <div className="flex flex-col gap-1">
        <h1 className="text-h3 font-semibold text-brand-ink">Subir un PDF hecho a mano</h1>
        <p className="text-body-sm text-ink-muted">
          Plan B, para cuando el COA no se puede armar con el formulario. Lo normal es cargar los
          datos y publicar desde la plantilla.
        </p>
      </div>
      <section className="max-w-2xl rounded-card-lg border border-line bg-surface p-6 md:p-8">
        <UploadForm
          key={state.draftVersion ?? state.nextVersion}
          documentId={id}
          nextVersion={state.draftVersion ?? state.nextVersion}
          hasDraft={state.draftVersion !== null}
        />
      </section>
    </div>
  );
}
