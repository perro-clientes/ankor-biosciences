import { CircleAlert, CircleCheck } from "lucide-react";

/** Piezas chicas compartidas por los formularios del panel. */

export function FormAlert({ tone, children }: { tone: "error" | "ok"; children: React.ReactNode }) {
  if (tone === "ok") {
    return (
      <p
        role="status"
        className="flex items-start gap-2 rounded-card bg-surface-tint p-3 text-body-sm font-normal text-ink-badge"
      >
        <CircleCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-brand-green" />
        <span>{children}</span>
      </p>
    );
  }
  return (
    <p
      role="alert"
      className="flex items-start gap-2 rounded-card border border-destructive/30 bg-surface p-3 text-body-sm font-normal text-destructive"
    >
      <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <span>{children}</span>
    </p>
  );
}

export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="text-sm font-normal text-destructive">
      {message}
    </p>
  );
}

export function AuthCard({
  title,
  intro,
  children,
}: {
  title: string;
  intro?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 rounded-card-lg border border-line bg-surface p-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-h3 font-semibold text-brand-ink">{title}</h1>
        {intro && <p className="text-body-sm text-ink-muted">{intro}</p>}
      </div>
      {children}
    </div>
  );
}
