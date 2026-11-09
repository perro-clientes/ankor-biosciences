import Link from "next/link";
import { LogOut } from "lucide-react";
import { signOut } from "@/lib/auth/actions";
import { HOME_PATH, PASSWORD_PATH, USERS_PATH } from "@/lib/auth/routing";
import { getAdminUser } from "@/lib/auth/session";

const linkClass =
  "inline-flex min-h-target items-center rounded-pill px-3 font-ui text-button tracking-[0.06em] text-brand-ink uppercase hover:bg-surface-tint";

/** Navegación del panel. Lee la sesión: va dentro de <Suspense>. Sin sesión no muestra nada. */
export async function AdminNav() {
  const user = await getAdminUser();
  if (!user) return null;

  return (
    <nav aria-label="Panel" className="flex flex-wrap items-center justify-end gap-1">
      {user.role && (
        <Link href={HOME_PATH} className={linkClass}>
          Lotes
        </Link>
      )}
      {user.role === "admin" && (
        <Link href={USERS_PATH} className={linkClass}>
          Usuarios
        </Link>
      )}
      <Link href={PASSWORD_PATH} className={linkClass}>
        Contraseña
      </Link>
      <form action={signOut}>
        <button type="submit" className={`${linkClass} gap-1.5`} title={user.email}>
          <LogOut aria-hidden="true" className="size-3.5" />
          Salir
        </button>
      </form>
    </nav>
  );
}
