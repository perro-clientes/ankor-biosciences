import type { Metadata } from "next";
import { Suspense } from "react";
import { requireRole } from "@/lib/auth/session";
import { listPanelUsers, type PanelUserStatus } from "@/lib/auth/users";
import { Badge } from "@/components/ui/badge";
import { InviteForm } from "./invite-form";
import { UserRowActions } from "./user-row-actions";

export const metadata: Metadata = { title: "Usuarios" };

const STATUS: Record<PanelUserStatus, string> = {
  activo: "Activo",
  pendiente: "Invitación pendiente",
  "sin-acceso": "Sin acceso",
};

const fmt = new Intl.DateTimeFormat("es-AR", { dateStyle: "medium", timeZone: "UTC" });
const date = (iso: string | null) => (iso ? fmt.format(new Date(iso)) : "—");

export default function UsersPage() {
  return (
    <Suspense fallback={<p className="text-body-sm text-ink-muted">Cargando…</p>}>
      <Users />
    </Suspense>
  );
}

async function Users() {
  const { user, allowed } = await requireRole(["admin"]);
  if (!allowed || user.role !== "admin") {
    return (
      <p className="rounded-card-lg border border-line bg-surface p-8 text-body-sm text-ink-muted">
        Solo los administradores pueden gestionar usuarios.
      </p>
    );
  }

  const users = await listPanelUsers();

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-h3 font-semibold text-brand-ink">Usuarios</h1>

      <section
        aria-labelledby="invite-title"
        className="flex flex-col gap-4 rounded-card-lg border border-line bg-surface p-6 md:p-8"
      >
        <h2 id="invite-title" className="text-h3-sm font-semibold text-brand-ink">
          Invitar a alguien
        </h2>
        <InviteForm />
      </section>

      <section
        aria-labelledby="list-title"
        className="rounded-card-lg border border-line bg-surface p-6 md:p-8"
      >
        <h2 id="list-title" className="mb-4 text-h3-sm font-semibold text-brand-ink">
          Personas con cuenta
        </h2>
        <ul className="flex flex-col">
          {users.map((u) => (
            <li
              key={u.id}
              className="grid grid-cols-1 gap-3 border-t border-line py-4 first:border-t-0 md:grid-cols-[1fr_auto] md:items-center"
            >
              <div className="flex flex-col gap-1">
                <p className="font-medium break-all text-brand-ink">
                  {u.email}
                  {u.id === user.id && <span className="text-ink-muted"> (vos)</span>}
                </p>
                <div className="flex flex-wrap items-center gap-2 text-sm font-normal text-ink-muted">
                  <Badge
                    className={
                      u.status === "sin-acceso"
                        ? "bg-muted text-ink-muted"
                        : u.status === "pendiente"
                          ? "bg-surface text-ink-badge ring-1 ring-line-strong"
                          : undefined
                    }
                  >
                    {STATUS[u.status]}
                  </Badge>
                  <span>Invitado: {date(u.invitedAt)}</span>
                  <span>· Último ingreso: {date(u.lastSignInAt)}</span>
                </div>
              </div>
              <UserRowActions user={u} isSelf={u.id === user.id} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
