import { AdminBrand } from "@/components/admin/brand";

/** Pantallas sin sesión: login y recupero de contraseña. */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex w-full max-w-5xl items-center px-5 py-3">
          <AdminBrand href="/admin/login" />
        </div>
      </header>
      <main id="main" className="w-full flex-1 px-5 py-12">
        {children}
      </main>
    </>
  );
}
