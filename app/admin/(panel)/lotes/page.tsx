import type { Metadata } from "next";
import { Suspense } from "react";
import { Plus } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { listLots } from "@/lib/lots/queries";
import { LotsTable } from "@/components/admin/lots-table";
import { NoAccess, PageHeader } from "@/components/admin/no-access";
import { Button } from "@/components/ui/button";

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
  const lots = await listLots();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHeader
          title="Lotes"
          intro="Cada lote es una URL fija impresa como QR. Lo que cambia es la versión publicada."
        />
        <Button href="/admin/lotes/nuevo" icon={Plus}>
          Nuevo lote
        </Button>
      </div>
      <div className="overflow-hidden rounded-card-lg border border-line bg-surface">
        <LotsTable lots={lots} />
      </div>
    </div>
  );
}
