import type { Metadata } from "next";
import { Suspense } from "react";
import { ROLE_LABEL, initialsFor } from "@/lib/auth/display";
import { requireUser } from "@/lib/auth/session";
import { FormAlert } from "@/components/admin/form-bits";
import { PageHeader } from "@/components/admin/no-access";
import { PasswordForm } from "./password-form";

export const metadata: Metadata = { title: "Perfil" };

const fmt = new Intl.DateTimeFormat("es-AR", {
  dateStyle: "long",
  timeStyle: "short",
  timeZone: "America/Argentina/Buenos_Aires",
});
const date = (iso: string | null) => (iso ? fmt.format(new Date(iso)) : "—");

export default function ProfilePage({ searchParams }: PageProps<"/admin/perfil">) {
  return (
    <Suspense fallback={<p className="text-body-sm text-ink-muted">Cargando…</p>}>
      <Profile searchParams={searchParams} />
    </Suspense>
  );
}

async function Profile({
  searchParams,
}: {
  searchParams: PageProps<"/admin/perfil">["searchParams"];
}) {
  const user = await requireUser();
  // Llega desde un link de invitación o de recupero: tiene que elegir contraseña.
  const mustSetPassword = (await searchParams).contrasena === "nueva";

  const rows: [string, string][] = [
    ["Email", user.email],
    ["Rol", user.role ? ROLE_LABEL[user.role] : "Sin rol asignado"],
    ["Cuenta creada", date(user.createdAt)],
    ["Último ingreso", date(user.lastSignInAt)],
  ];

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Perfil" />

      {mustSetPassword && (
        <FormAlert tone="ok">
          Elegí una contraseña para terminar de activar tu cuenta. Vas a usarla para ingresar al
          panel.
        </FormAlert>
      )}

      <section
        aria-labelledby="datos-title"
        className="flex flex-col gap-6 rounded-card-lg border border-line bg-surface p-6 md:p-8"
      >
        <div className="flex items-center gap-4">
          <span
            aria-hidden="true"
            className="flex size-14 items-center justify-center rounded-pill bg-brand-green font-ui text-base font-bold text-white"
          >
            {initialsFor(user.email)}
          </span>
          <h2 id="datos-title" className="text-h3-sm font-semibold text-brand-ink">
            Tus datos
          </h2>
        </div>
        <dl className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
          {rows.map(([label, value]) => (
            <div key={label} className="flex flex-col gap-1">
              <dt className="font-ui text-caption tracking-[0.08em] text-ink-muted uppercase">
                {label}
              </dt>
              <dd className="text-body-sm font-normal break-all text-brand-ink">{value}</dd>
            </div>
          ))}
        </dl>
        <p className="text-sm font-normal text-ink-muted">
          Para cambiar tu email o tu rol, pedíselo a un administrador.
        </p>
      </section>

      <section
        id="contrasena"
        aria-labelledby="password-title"
        className="flex flex-col gap-6 rounded-card-lg border border-line bg-surface p-6 md:p-8"
      >
        <h2 id="password-title" className="text-h3-sm font-semibold text-brand-ink">
          {mustSetPassword ? "Elegí tu contraseña" : "Cambiar contraseña"}
        </h2>
        <div className="max-w-md">
          <PasswordForm email={user.email} />
        </div>
      </section>
    </div>
  );
}
