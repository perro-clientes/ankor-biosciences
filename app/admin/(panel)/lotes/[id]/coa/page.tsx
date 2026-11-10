import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ChevronLeft } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { activeTemplate, editorState, latestPublishedCoa, listCoaSources } from "@/lib/coa/service";
import { publicPdfUrl } from "@/lib/lots/naming";
import { getLot } from "@/lib/lots/queries";
import { baseTemplate, copyStructure } from "@/lib/pdf/coa-defaults";
import type { CoaDoc } from "@/lib/pdf/coa-schema";
import { CoaStartForm } from "@/components/admin/coa-start";
import { NoAccess } from "@/components/admin/no-access";
import { CoaEditor } from "./coa-editor";

export const metadata: Metadata = { title: "Cargar COA" };

export default function CoaPage(props: PageProps<"/admin/lotes/[id]/coa">) {
  return (
    <Suspense fallback={<p className="text-body-sm text-ink-muted">Cargando…</p>}>
      <Editor {...props} />
    </Suspense>
  );
}

const UUID = /^[0-9a-f-]{36}$/i;

async function Editor({ params, searchParams }: PageProps<"/admin/lotes/[id]/coa">) {
  const { user, allowed } = await requireRole();
  if (!allowed) return <NoAccess email={user.email} />;

  const { id } = await params;
  const query = await searchParams;
  const [lot, state] = await Promise.all([getLot(id), editorState(id)]);
  if (!lot || !state) notFound();

  // De dónde sale el documento inicial.
  let initial: CoaDoc | null = state.data;
  let intro: string | null =
    state.source === "borrador"
      ? "Seguís desde el borrador guardado."
      : state.source === "publicado"
        ? "Partís de la última versión publicada: los cambios se publican como versión nueva."
        : null;

  if (!initial) {
    const mode = typeof query.modo === "string" ? query.modo : null;
    const origin = typeof query.origen === "string" ? query.origen : null;
    if (mode === "base") {
      initial = baseTemplate((await activeTemplate()).footnotes);
      intro = "Arrancás de la plantilla base. Agregá, quitá o editá lo que necesites.";
    } else if (mode === "copiar" && origin && UUID.test(origin)) {
      const source = await latestPublishedCoa(origin);
      if (source) {
        initial = copyStructure(source, query.valores === "1");
        intro =
          query.valores === "1"
            ? "Copiaste la estructura y los valores de otro lote: revisá y corregí todo antes de publicar."
            : "Copiaste la estructura de otro lote, con los valores vacíos.";
      }
    }
  }

  const editorKey = [
    state.source ?? "nuevo",
    state.nextVersion,
    state.draftVersion ?? "-",
    typeof query.modo === "string" ? query.modo : "",
    typeof query.origen === "string" ? query.origen : "",
    query.valores === "1" ? "v" : "",
  ].join(":");

  return (
    <div className="flex flex-col gap-6">
      <Link
        href={`/admin/lotes/${lot.id}`}
        className="inline-flex min-h-target items-center gap-1 self-start text-sm text-ink-muted hover:text-brand-ink"
      >
        <ChevronLeft aria-hidden="true" className="size-4" />
        {lot.label}
      </Link>
      <div className="flex flex-col gap-1">
        <h1 className="text-h3 font-semibold text-brand-ink">COA de {lot.label}</h1>
        <p className="text-body-sm text-ink-muted">
          Todo es editable: líneas, tablas, columnas y celdas. La vista previa usa la misma
          plantilla que el PDF publicado.
        </p>
      </div>

      {initial ? (
        <CoaEditor
          // Next 16 (Cache Components) conserva el estado de las pantallas visitadas
          // con <Activity>. La key cambia cuando cambia lo que manda el servidor
          // (nueva versión publicada, borrador, plantilla elegida): el editor se
          // reinicia con esos datos. Si nada cambió, se conserva lo que se estaba escribiendo.
          key={editorKey}
          documentId={lot.id}
          lotLabel={lot.label}
          publicUrl={publicPdfUrl(lot.fileName, lot.urlPrefix)}
          initial={initial}
          nextVersion={state.nextVersion}
          intro={intro}
        />
      ) : (
        <section className="max-w-lg rounded-card-lg border border-line bg-surface p-6 md:p-8">
          <h2 className="mb-4 text-h3-sm font-semibold text-brand-ink">¿Cómo querés empezar?</h2>
          <CoaStartForm
            documentId={lot.id}
            sources={(await listCoaSources(lot.id)).map((s) => ({
              documentId: s.documentId,
              label: s.label,
              version: s.version,
            }))}
          />
        </section>
      )}
    </div>
  );
}
