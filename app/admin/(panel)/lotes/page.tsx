import type { Metadata } from "next";
import { Suspense } from "react";
import { requireRole } from "@/lib/auth/session";
import { NoAccess, PageHeader } from "@/components/admin/no-access";

export const metadata: Metadata = { title: "Lotes" };

export default function LotsPage() {
  return (
    <Suspense fallback={<p className="text-body-sm text-ink-muted">Cargando…</p>}>
      <Lots />
    </Suspense>
  );
}

async function Lots() {
  const { user, allowed } = await requireRole();
  if (!allowed) return <NoAccess email={user.email} />;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Lotes" />
      <section className="rounded-card-lg border border-line bg-surface p-8">
        <p className="text-body-sm text-ink-muted">
          Acá vas a poder crear lotes, descargar sus QR y publicar los COAs. Próximamente.
        </p>
      </section>
    </div>
  );
}
