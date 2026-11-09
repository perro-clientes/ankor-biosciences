import "server-only";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { LOGIN_PATH } from "./routing";

export type AdminRole = "admin" | "editor";
export type AdminUser = { id: string; email: string; role: AdminRole | null };

/**
 * Data Access Layer del panel: lee la sesión (getUser valida contra Supabase
 * Auth) y el rol en user_roles (RLS: cada uno ve su propia fila).
 * Llamar siempre desde componentes dentro de <Suspense> (Cache Components).
 */
export async function getAdminUser(): Promise<AdminUser | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;

  const { data: row } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", data.user.id)
    .maybeSingle();

  return {
    id: data.user.id,
    email: data.user.email ?? "",
    role: (row?.role as AdminRole | undefined) ?? null,
  };
}

/** Exige sesión. Sin sesión → login. Devuelve el usuario aunque no tenga rol. */
export async function requireUser(): Promise<AdminUser> {
  const user = await getAdminUser();
  if (!user) redirect(LOGIN_PATH);
  return user;
}

/** Exige sesión y rol (editor o admin). */
export async function requireRole(roles: AdminRole[] = ["admin", "editor"]) {
  const user = await requireUser();
  if (!user.role || !roles.includes(user.role)) return { user, allowed: false as const };
  return { user: user as AdminUser & { role: AdminRole }, allowed: true as const };
}
