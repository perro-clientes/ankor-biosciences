import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Panel de COAs", template: `%s | Panel de COAs` },
  robots: { index: false, follow: false },
};

/**
 * Raíz del panel. Dos grupos con su propio layout:
 * - (auth): login, recupero y callback de links (sin menú).
 * - (panel): navbar con avatar + sidebar (requiere sesión).
 */
export default function AdminRootLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div lang="es" className="flex min-h-full flex-1 flex-col bg-surface-muted">
      {children}
    </div>
  );
}
