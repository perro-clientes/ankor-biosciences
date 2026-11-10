import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ChevronLeft } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { suggestNextLot } from "@/lib/lots/naming";
import { listFileNames } from "@/lib/lots/queries";
import { NoAccess, PageHeader } from "@/components/admin/no-access";
import { NewLotForm } from "./new-lot-form";

export const metadata: Metadata = { title: "Nuevo lote" };

export default function NewLotPage() {
  return (
    <Suspense fallback={<p className="text-body-sm text-ink-muted">Cargando…</p>}>
      <NewLot />
    </Suspense>
  );
}

async function NewLot() {
  const { user, allowed } = await requireRole();
  if (!allowed) return <NoAccess email={user.email} />;
  const suggestion = suggestNextLot(await listFileNames());

  return (
    <div className="flex flex-col gap-8">
      <Link
        href="/admin/lotes"
        className="inline-flex min-h-target items-center gap-1 self-start text-sm text-ink-muted hover:text-brand-ink"
      >
        <ChevronLeft aria-hidden="true" className="size-4" />
        Lotes
      </Link>
      <PageHeader
        title="Nuevo lote"
        intro="Te proponemos el siguiente número de lote. Revisalo antes de confirmar."
      />
      <section className="max-w-2xl rounded-card-lg border border-line bg-surface p-6 md:p-8">
        {/* key: con <Activity> el form conserva su estado; si cambia la sugerencia, se reinicia. */}
        <NewLotForm
          key={suggestion.fileName}
          fileName={suggestion.fileName}
          label={suggestion.label}
        />
      </section>
    </div>
  );
}
