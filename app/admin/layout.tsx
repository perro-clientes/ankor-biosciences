import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { site } from "@/content/site";
import { AdminNav } from "@/components/admin/admin-nav";

export const metadata: Metadata = {
  title: { default: "Panel de COAs", template: `%s | Panel de COAs` },
  robots: { index: false, follow: false },
};

/** Marco del panel. Estático salvo la navegación, que lee la sesión dentro de <Suspense>. */
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div lang="es" className="flex min-h-full flex-1 flex-col bg-surface-muted">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-4 px-5 py-3">
          <Link href="/admin" className="flex min-h-target items-center gap-3">
            <Image
              src={site.logo.dark.src}
              alt={site.logo.dark.alt}
              width={site.logo.dark.width}
              height={site.logo.dark.height}
              className="h-7 w-auto"
            />
            <span className="hidden border-l border-line pl-3 font-ui text-button tracking-[0.06em] text-ink-muted uppercase sm:inline">
              Panel de COAs
            </span>
          </Link>
          <Suspense fallback={null}>
            <AdminNav />
          </Suspense>
        </div>
      </header>
      <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-5 py-10">
        {children}
      </main>
    </div>
  );
}
