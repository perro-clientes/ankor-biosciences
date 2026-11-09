import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ChevronLeft, Download, ExternalLink } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { publicPdfPath, publicPdfUrl } from "@/lib/lots/naming";
import { qrSvg } from "@/lib/lots/qr";
import { getLot } from "@/lib/lots/queries";
import { CopyButton } from "@/components/admin/copy-button";
import { FormAlert } from "@/components/admin/form-bits";
import { KIND_LABEL, LotStatusBadge, shortDate } from "@/components/admin/lot-status";
import { NoAccess } from "@/components/admin/no-access";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Lote" };

export default function LotPage(props: PageProps<"/admin/lotes/[id]">) {
  return (
    <Suspense fallback={<p className="text-body-sm text-ink-muted">Cargando…</p>}>
      <Lot {...props} />
    </Suspense>
  );
}

const kb = (bytes: number | null) => (bytes ? `${Math.round(bytes / 1024)} KB` : "—");

async function Lot({ params, searchParams }: PageProps<"/admin/lotes/[id]">) {
  const { user, allowed } = await requireRole();
  if (!allowed) return <NoAccess email={user.email} />;

  const { id } = await params;
  const created = (await searchParams).creado === "1";
  const lot = await getLot(id);
  if (!lot) notFound();

  const url = publicPdfUrl(lot.fileName, lot.urlPrefix);
  const svg = await qrSvg(lot.fileName, lot.urlPrefix);
  const qrBase = `/admin/lotes/${lot.id}/qr`;

  return (
    <div className="flex flex-col gap-8">
      <Link
        href="/admin/lotes"
        className="inline-flex min-h-target items-center gap-1 self-start text-sm text-ink-muted hover:text-brand-ink"
      >
        <ChevronLeft aria-hidden="true" className="size-4" />
        Lotes
      </Link>

      {created && (
        <FormAlert tone="ok">
          Lote creado. La URL ya responde con un PDF provisorio: podés descargar el QR y mandarlo a
          imprenta.
        </FormAlert>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-h3 font-semibold text-brand-ink">{lot.label}</h1>
        <LotStatusBadge status={lot.status} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <section
          aria-labelledby="url-title"
          className="flex flex-col gap-5 rounded-card-lg border border-line bg-surface p-6 md:p-8"
        >
          <h2 id="url-title" className="text-h3-sm font-semibold text-brand-ink">
            URL del QR
          </h2>
          <p className="rounded-card bg-surface-muted p-4 font-mono text-sm break-all text-brand-ink">
            {url}
          </p>
          <div className="flex flex-wrap gap-2">
            <CopyButton value={url} label="Copiar URL" />
            <Button
              href={publicPdfPath(lot.fileName, lot.urlPrefix)}
              variant="outline"
              icon={ExternalLink}
              target="_blank"
              rel="noopener"
            >
              Ver PDF publicado
            </Button>
          </div>
          <dl className="grid grid-cols-1 gap-4 border-t border-line pt-5 text-sm sm:grid-cols-3">
            <div>
              <dt className="font-ui text-caption tracking-[0.08em] text-ink-muted uppercase">
                Versión publicada
              </dt>
              <dd className="text-brand-ink">
                {lot.publishedVersion ? `v${lot.publishedVersion}` : "—"}
              </dd>
            </div>
            <div>
              <dt className="font-ui text-caption tracking-[0.08em] text-ink-muted uppercase">
                Publicada
              </dt>
              <dd className="text-brand-ink">{shortDate(lot.publishedAt)}</dd>
            </div>
            <div>
              <dt className="font-ui text-caption tracking-[0.08em] text-ink-muted uppercase">
                Origen
              </dt>
              <dd className="text-brand-ink">{KIND_LABEL[lot.kind]}</dd>
            </div>
          </dl>
        </section>

        <section
          aria-labelledby="qr-title"
          className="flex flex-col items-center gap-4 rounded-card-lg border border-line bg-surface p-6"
        >
          <h2 id="qr-title" className="self-start text-h3-sm font-semibold text-brand-ink">
            QR
          </h2>
          <div
            role="img"
            aria-label={`Código QR que abre ${url}`}
            className="w-full max-w-[240px] [&_svg]:h-auto [&_svg]:w-full"
            dangerouslySetInnerHTML={{ __html: svg }}
          />
          <div className="flex w-full flex-col gap-2">
            <Button href={`${qrBase}?format=svg`} icon={Download} className="w-full" download>
              SVG para imprenta
            </Button>
            <Button
              href={`${qrBase}?format=png`}
              variant="outline"
              icon={Download}
              className="w-full"
              download
            >
              PNG 2048 px
            </Button>
          </div>
          <p className="text-center text-xs font-normal text-ink-muted">
            Corrección de errores Q · margen de 4 módulos
          </p>
        </section>
      </div>

      <section
        aria-labelledby="versions-title"
        className="rounded-card-lg border border-line bg-surface p-6 md:p-8"
      >
        <h2 id="versions-title" className="mb-4 text-h3-sm font-semibold text-brand-ink">
          Versiones
        </h2>
        <ul className="flex flex-col">
          {lot.versions.map((v) => (
            <li
              key={v.id}
              className="flex flex-wrap items-center justify-between gap-3 border-t border-line py-3 text-sm first:border-t-0"
            >
              <span className="flex items-center gap-3">
                <span className="font-medium text-brand-ink">v{v.version}</span>
                {v.id === lot.publishedVersionId && (
                  <span className="rounded-pill bg-surface-tint px-2 py-0.5 text-xs text-ink-badge">
                    En la URL
                  </span>
                )}
                <span className="text-ink-muted">
                  {v.publishedAt ? `Publicada ${shortDate(v.publishedAt)}` : "Borrador"}
                  {v.version === 1 && lot.kind === "template" && !v.hasData
                    ? " · PDF provisorio"
                    : ""}
                </span>
              </span>
              <span className="text-ink-muted">{kb(v.sizeBytes)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm font-normal text-ink-muted">
          Cargar los datos del COA y publicar una versión nueva: próximamente.
        </p>
      </section>
    </div>
  );
}
