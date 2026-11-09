import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Plus, UserPlus } from "lucide-react";
import { ROLE_LABEL, USER_STATUS_LABEL } from "@/lib/auth/display";
import { LOTS_PATH, USERS_PATH } from "@/lib/auth/routing";
import { requireRole } from "@/lib/auth/session";
import { listPanelUsers } from "@/lib/auth/users";
import { listLots } from "@/lib/lots/queries";
import { FormAlert } from "@/components/admin/form-bits";
import { LotsTable } from "@/components/admin/lots-table";
import { NoAccess, PageHeader } from "@/components/admin/no-access";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Dashboard" };

const PREVIEW_ROWS = 5;

export default function DashboardPage({ searchParams }: PageProps<"/admin">) {
  return (
    <Suspense fallback={<p className="text-body-sm text-ink-muted">Cargando…</p>}>
      <Dashboard searchParams={searchParams} />
    </Suspense>
  );
}

async function Dashboard({ searchParams }: { searchParams: PageProps<"/admin">["searchParams"] }) {
  const { user, allowed } = await requireRole();
  const passwordSaved = (await searchParams).password === "ok";
  if (!allowed) return <NoAccess email={user.email} />;

  const isAdmin = user.role === "admin";
  const [lots, users] = await Promise.all([
    listLots(),
    isAdmin ? listPanelUsers() : Promise.resolve(null),
  ]);

  return (
    <div className="flex flex-col gap-8">
      {passwordSaved && <FormAlert tone="ok">Contraseña guardada.</FormAlert>}
      <PageHeader title="Dashboard" intro={`Hola, ${user.email}.`} />

      <DashboardCard
        title="COAs"
        count={lots.length}
        countLabel={lots.length === 1 ? "lote" : "lotes"}
        allHref={LOTS_PATH}
        action={
          <Button href="/admin/lotes/nuevo" icon={Plus}>
            Crear
          </Button>
        }
      >
        <LotsTable lots={lots.slice(0, PREVIEW_ROWS)} compact />
      </DashboardCard>

      {users && (
        <DashboardCard
          title="Usuarios"
          count={users.length}
          countLabel={users.length === 1 ? "cuenta" : "cuentas"}
          allHref={USERS_PATH}
          action={
            <Button href={`${USERS_PATH}#invitar`} icon={UserPlus}>
              Nuevo usuario
            </Button>
          }
        >
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Usuarios</caption>
            <thead className="border-b border-line bg-surface-muted font-ui text-caption tracking-[0.08em] text-ink-muted uppercase">
              <tr>
                <th scope="col" className="px-5 py-3 font-normal">
                  Email
                </th>
                <th scope="col" className="hidden px-5 py-3 font-normal sm:table-cell">
                  Rol
                </th>
                <th scope="col" className="px-5 py-3 font-normal">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody>
              {users.slice(0, PREVIEW_ROWS).map((u) => (
                <tr key={u.id} className="border-t border-line first:border-t-0">
                  <td className="px-5 py-3 break-all text-brand-ink">
                    {u.email}
                    {u.id === user.id && <span className="text-ink-muted"> (vos)</span>}
                  </td>
                  <td className="hidden px-5 py-3 text-ink-muted sm:table-cell">
                    {u.role ? ROLE_LABEL[u.role] : "—"}
                  </td>
                  <td className="px-5 py-3">
                    <Badge
                      className={
                        u.status === "sin-acceso"
                          ? "bg-muted text-ink-muted"
                          : u.status === "pendiente"
                            ? "bg-surface text-ink-badge ring-1 ring-line-strong"
                            : undefined
                      }
                    >
                      {USER_STATUS_LABEL[u.status]}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </DashboardCard>
      )}
    </div>
  );
}

function DashboardCard({
  title,
  count,
  countLabel,
  allHref,
  action,
  children,
}: {
  title: string;
  count: number;
  countLabel: string;
  allHref: string;
  action: React.ReactNode;
  children: React.ReactNode;
}) {
  const id = `card-${title.toLowerCase()}`;
  return (
    <section
      aria-labelledby={id}
      className="overflow-hidden rounded-card-lg border border-line bg-surface"
    >
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 md:px-6">
        <div className="flex flex-col gap-0.5">
          <h2 id={id} className="text-h3-sm font-semibold text-brand-ink">
            {title}
          </h2>
          <p className="text-sm font-normal text-ink-muted">
            {count} {countLabel}
          </p>
        </div>
        {action}
      </div>
      <div className="border-t border-line">{children}</div>
      {count > PREVIEW_ROWS && (
        <div className="border-t border-line px-5 py-3 md:px-6">
          <Link
            href={allHref}
            className="inline-flex min-h-target items-center text-sm font-medium text-brand-green underline-offset-2 hover:underline"
          >
            Ver todos ({count})
          </Link>
        </div>
      )}
    </section>
  );
}
