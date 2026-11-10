import "server-only";

import type { User } from "@supabase/supabase-js";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { AdminRole } from "./session";

export type PanelUserStatus = "activo" | "pendiente" | "sin-acceso";

export type PanelUser = {
  id: string;
  email: string;
  role: AdminRole | null;
  status: PanelUserStatus;
  invitedAt: string | null;
  lastSignInAt: string | null;
};

export function isBanned(user: Pick<User, "banned_until">): boolean {
  const until = (user as { banned_until?: string | null }).banned_until;
  return Boolean(until && new Date(until).getTime() > Date.now());
}

export function statusOf(user: User, role: AdminRole | null): PanelUserStatus {
  if (!role || isBanned(user)) return "sin-acceso";
  return user.last_sign_in_at ? "activo" : "pendiente";
}

/** Todos los usuarios de Auth con su rol. Solo para admins (usa la service role). */
export async function listPanelUsers(): Promise<PanelUser[]> {
  const db = createSupabaseAdminClient();
  const [{ data: authData, error }, { data: roles, error: rolesError }] = await Promise.all([
    db.auth.admin.listUsers({ perPage: 1000 }),
    db.from("user_roles").select("user_id, role"),
  ]);
  if (error) throw new Error(`listUsers: ${error.message}`);
  if (rolesError) throw new Error(`user_roles: ${rolesError.message}`);

  const roleById = new Map(roles.map((r) => [r.user_id as string, r.role as AdminRole]));
  return authData.users
    .map((u) => {
      const role = roleById.get(u.id) ?? null;
      return {
        id: u.id,
        email: u.email ?? "",
        role,
        status: statusOf(u, role),
        invitedAt: u.invited_at ?? u.created_at ?? null,
        lastSignInAt: u.last_sign_in_at ?? null,
      };
    })
    .sort((a, b) => a.email.localeCompare(b.email));
}

export async function findAuthUserByEmail(email: string): Promise<User | null> {
  const db = createSupabaseAdminClient();
  const { data, error } = await db.auth.admin.listUsers({ perPage: 1000 });
  if (error) throw new Error(`listUsers: ${error.message}`);
  return data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase()) ?? null;
}

export async function countAdmins(): Promise<number> {
  const db = createSupabaseAdminClient();
  const { count, error } = await db
    .from("user_roles")
    .select("user_id", { count: "exact", head: true })
    .eq("role", "admin");
  if (error) throw new Error(`user_roles: ${error.message}`);
  return count ?? 0;
}

export async function audit(actor: string, action: string, details: Record<string, unknown>) {
  const db = createSupabaseAdminClient();
  const { error } = await db.from("audit_log").insert({ actor, action, details });
  if (error) console.error("[audit]", action, error.message);
}
