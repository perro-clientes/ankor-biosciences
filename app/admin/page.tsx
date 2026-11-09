import { Suspense } from "react";
import { ShieldAlert } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { FormAlert } from "@/components/admin/form-bits";

export default function AdminHome({ searchParams }: PageProps<"/admin">) {
  return (
    <Suspense fallback={<p className="text-body-sm text-ink-muted">Cargando…</p>}>
      <Dashboard searchParams={searchParams} />
    </Suspense>
  );
}

async function Dashboard({ searchParams }: { searchParams: PageProps<"/admin">["searchParams"] }) {
  const { user, allowed } = await requireRole();
  const passwordSaved = (await searchParams).password === "ok";

  if (!allowed) {
    return (
      <div className="mx-auto flex max-w-md flex-col gap-4 rounded-card-lg border border-line bg-surface p-8">
        <ShieldAlert aria-hidden="true" className="size-8 text-destructive" />
        <h1 className="text-h3 font-semibold text-brand-ink">Tu cuenta no tiene acceso</h1>
        <p className="text-body-sm text-ink-muted">
          Ingresaste como <strong className="font-medium text-brand-ink">{user.email}</strong>, pero
          no tenés un rol asignado. Pedile a un administrador que te habilite.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {passwordSaved && <FormAlert tone="ok">Contraseña guardada.</FormAlert>}
      <div className="flex flex-col gap-1">
        <p className="font-ui text-eyebrow text-ink-muted uppercase">
          {user.role === "admin" ? "Administrador" : "Editor"}
        </p>
        <h1 className="text-h3 font-semibold break-all text-brand-ink">Hola, {user.email}</h1>
      </div>
      <section className="rounded-card-lg border border-line bg-surface p-8">
        <h2 className="text-h3-sm font-semibold text-brand-ink">Lotes</h2>
        <p className="mt-2 text-body-sm text-ink-muted">
          Acá vas a poder crear lotes, descargar sus QR y publicar los COAs. Próximamente.
        </p>
      </section>
    </div>
  );
}
