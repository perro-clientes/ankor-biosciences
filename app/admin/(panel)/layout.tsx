import { Suspense } from "react";
import { requireUser } from "@/lib/auth/session";
import { AdminBrand } from "@/components/admin/brand";
import { ConfirmProvider } from "@/components/admin/confirm";
import { ToastProvider } from "@/components/admin/toast";
import { Sidebar } from "@/components/admin/sidebar";
import { UserMenu } from "@/components/admin/user-menu";

/**
 * Panel: navbar (logo + avatar con Perfil/Salir) y sidebar (Dashboard/Lotes/Usuarios).
 * Todo lo que depende de la sesión va dentro de <Suspense> (Cache Components).
 */
export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<ShellSkeleton />}>
      <PanelShell>{children}</PanelShell>
    </Suspense>
  );
}

async function PanelShell({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-line bg-surface">
        <div className="flex items-center justify-between gap-4 px-5 py-2">
          <AdminBrand />
          <UserMenu email={user.email} role={user.role} />
        </div>
      </header>
      <div className="flex flex-1 flex-col md:flex-row">
        <aside className="border-b border-line bg-surface px-3 py-2 md:sticky md:top-[61px] md:h-[calc(100dvh-61px)] md:w-56 md:shrink-0 md:border-r md:border-b-0 md:py-6">
          <Sidebar role={user.role} />
        </aside>
        <main id="main" className="w-full min-w-0 flex-1 px-5 py-8 md:px-10 md:py-10">
          <ToastProvider>
            <ConfirmProvider>
              <div className="mx-auto w-full max-w-5xl">{children}</div>
            </ConfirmProvider>
          </ToastProvider>
        </main>
      </div>
    </>
  );
}

function ShellSkeleton() {
  return (
    <>
      <header className="h-[61px] border-b border-line bg-surface" />
      <div className="flex flex-1">
        <aside className="hidden w-56 border-r border-line bg-surface md:block" />
        <main id="main" className="flex-1 px-10 py-10">
          <p className="text-body-sm text-ink-muted">Cargando…</p>
        </main>
      </div>
    </>
  );
}
