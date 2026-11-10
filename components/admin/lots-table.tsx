import Link from "next/link";
import { publicPdfPath } from "@/lib/lots/naming";
import type { LotSummary } from "@/lib/lots/queries";
import { KIND_LABEL, LotStatusBadge, shortDate } from "./lot-status";

const th = "px-5 py-3 font-normal";

/**
 * Tabla de lotes. `compact`: versión reducida para el Dashboard (sin origen ni
 * fecha, y sin bordes externos: va dentro de una card).
 */
export function LotsTable({ lots, compact = false }: { lots: LotSummary[]; compact?: boolean }) {
  return (
    <>
      <table className="w-full text-left text-sm">
        <caption className="sr-only">Lotes</caption>
        <thead className="border-b border-line bg-surface-muted font-ui text-caption tracking-[0.08em] text-ink-muted uppercase">
          <tr>
            <th scope="col" className={th}>
              Lote
            </th>
            <th scope="col" className={th}>
              Estado
            </th>
            <th scope="col" className={`hidden ${th} sm:table-cell`}>
              Versión
            </th>
            {!compact && (
              <>
                <th scope="col" className={`hidden ${th} md:table-cell`}>
                  Publicado
                </th>
                <th scope="col" className={`hidden ${th} lg:table-cell`}>
                  Origen
                </th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {lots.map((lot) => (
            <tr
              key={lot.id}
              className="border-t border-line first:border-t-0 hover:bg-surface-muted"
            >
              <td className="px-5 py-3">
                <Link href={`/admin/lotes/${lot.id}`} className="flex flex-col gap-0.5">
                  <span className="font-medium text-brand-ink underline-offset-2 hover:underline">
                    {lot.label}
                  </span>
                  <span className="font-mono text-xs break-all text-ink-muted">
                    {publicPdfPath(lot.fileName, lot.urlPrefix)}
                  </span>
                </Link>
              </td>
              <td className="px-5 py-3">
                <LotStatusBadge status={lot.status} />
              </td>
              <td className="hidden px-5 py-3 text-ink-muted sm:table-cell">
                {lot.publishedVersion ? `v${lot.publishedVersion}` : "—"}
              </td>
              {!compact && (
                <>
                  <td className="hidden px-5 py-3 text-ink-muted md:table-cell">
                    {shortDate(lot.publishedAt)}
                  </td>
                  <td className="hidden px-5 py-3 text-ink-muted lg:table-cell">
                    {KIND_LABEL[lot.kind]}
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {lots.length === 0 && (
        <p className="p-8 text-body-sm text-ink-muted">Todavía no hay lotes.</p>
      )}
    </>
  );
}
