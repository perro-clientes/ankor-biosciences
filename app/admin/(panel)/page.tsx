import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight } from "lucide-react";
import { LOTS_PATH } from "@/lib/auth/routing";
import { requireRole } from "@/lib/auth/session";
import { FormAlert } from "@/components/admin/form-bits";
import { NoAccess, PageHeader } from "@/components/admin/no-access";

export const metadata: Metadata = { title: "Dashboard" };

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

  return (
    <div className="flex flex-col gap-8">
      {passwordSaved && <FormAlert tone="ok">Contraseña guardada.</FormAlert>}
      <PageHeader title="Dashboard" intro={`Hola, ${user.email}.`} />
      <Link
        href={LOTS_PATH}
        className="group flex items-center justify-between gap-4 rounded-card-lg border border-line bg-surface p-6 transition-colors hover:border-line-strong md:p-8"
      >
        <span className="flex flex-col gap-1">
          <span className="text-h3-sm font-semibold text-brand-ink">Lotes</span>
          <span className="text-body-sm text-ink-muted">
            Crear lotes, descargar sus QR y publicar los COAs.
          </span>
        </span>
        <ArrowRight
          aria-hidden="true"
          className="size-5 text-brand-green transition-transform group-hover:translate-x-0.5"
        />
      </Link>
    </div>
  );
}
