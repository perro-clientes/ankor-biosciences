/**
 * Reglas de navegación del panel, sin dependencias (testeables).
 */

export const LOGIN_PATH = "/admin/login";
export const HOME_PATH = "/admin";
export const AUTH_CALLBACK_PATH = "/admin/auth/confirm";
export const RECOVER_PATH = "/admin/recuperar";
export const PASSWORD_PATH = "/admin/cuenta/contrasena";
export const USERS_PATH = "/admin/usuarios";

/** Rutas de /admin accesibles sin sesión. */
export function isPublicAdminPath(pathname: string): boolean {
  return (
    pathname === LOGIN_PATH || pathname === RECOVER_PATH || pathname.startsWith("/admin/auth/")
  );
}

/**
 * Destino seguro después del login o de un link de email: solo rutas internas
 * del panel. Evita open redirects (//evil.com, https://…, /\evil.com, etc.).
 */
export function safeNextPath(next: string | null | undefined, fallback = HOME_PATH): string {
  if (!next) return fallback;
  if (!next.startsWith("/admin")) return fallback;
  if (next.startsWith("//") || next.includes("\\") || /[\r\n\t]/.test(next)) return fallback;
  try {
    // Se valida la ruta YA normalizada: "/admin/../x" se resuelve a "/x".
    const url = new URL(next, "https://ankor.invalid");
    if (url.origin !== "https://ankor.invalid") return fallback;
    const isAdmin = url.pathname === HOME_PATH || url.pathname.startsWith(`${HOME_PATH}/`);
    if (!isAdmin || isPublicAdminPath(url.pathname)) return fallback;
    return `${url.pathname}${url.search}`;
  } catch {
    return fallback;
  }
}

/** Tipos de link de email de Supabase que llevan a elegir contraseña. */
export function needsPasswordSetup(type: string | null): boolean {
  return type === "invite" || type === "recovery";
}

/**
 * Decisión del proxy para una request a /admin. Chequeo optimista (solo sesión);
 * el rol se verifica en el servidor (lib/auth/session.ts) antes de mostrar datos.
 */
export function adminRedirect(pathname: string, hasSession: boolean): string | null {
  if (!pathname.startsWith("/admin")) return null;
  if (pathname.startsWith("/admin/auth/")) return null;
  if (pathname === LOGIN_PATH || pathname === RECOVER_PATH) return hasSession ? HOME_PATH : null;
  if (!hasSession) return `${LOGIN_PATH}?next=${encodeURIComponent(pathname)}`;
  return null;
}
