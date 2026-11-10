import { ShieldAlert } from "lucide-react";

/** Usuario con sesión pero sin rol (o sin el rol que pide la pantalla). */
export function NoAccess({ email, message }: { email: string; message?: string }) {
  return (
    <div className="flex max-w-lg flex-col gap-4 rounded-card-lg border border-line bg-surface p-8">
      <ShieldAlert aria-hidden="true" className="size-8 text-destructive" />
      <h1 className="text-h3 font-semibold text-brand-ink">No tenés acceso a esta sección</h1>
      <p className="text-body-sm text-ink-muted">
        {message ?? (
          <>
            Ingresaste como <strong className="font-medium text-brand-ink">{email}</strong>, pero no
            tenés un rol asignado. Pedile a un administrador que te habilite.
          </>
        )}
      </p>
    </div>
  );
}

export function PageHeader({ title, intro }: { title: string; intro?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <h1 className="text-h3 font-semibold text-brand-ink">{title}</h1>
      {intro && <p className="text-body-sm text-ink-muted">{intro}</p>}
    </div>
  );
}
