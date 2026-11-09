"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { FormState } from "./actions";
import { checkRoleChange, type RoleChange } from "./guards";
import { emailCallbackUrl } from "./origin";
import { PASSWORD_PATH, USERS_PATH } from "./routing";
import { inviteSchema, roleSchema } from "./schemas";
import { requireRole } from "./session";
import { audit, countAdmins, findAuthUserByEmail, isBanned } from "./users";

/**
 * Acciones de administración de usuarios. Cada una verifica de nuevo que quien
 * la ejecuta sea admin (nunca confiar en que la pantalla esté oculta).
 */

async function requireAdmin() {
  const { user, allowed } = await requireRole(["admin"]);
  if (!allowed || user.role !== "admin") {
    return {
      ok: false as const,
      state: { status: "error", message: "Solo un administrador puede hacer esto." } as FormState,
    };
  }
  return { ok: true as const, user };
}

const BAN_FOREVER = "876000h"; // ~100 años: Supabase no tiene "para siempre"

async function sendInvite(email: string) {
  const db = createSupabaseAdminClient();
  return db.auth.admin.inviteUserByEmail(email, {
    redirectTo: await emailCallbackUrl(PASSWORD_PATH),
  });
}

/** Invita por email con un rol. Si el usuario ya existe, le asigna el rol (y lo rehabilita). */
export async function inviteUser(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.state;

  const parsed = inviteSchema.safeParse({
    email: formData.get("email"),
    role: formData.get("role"),
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) fieldErrors[String(i.path[0])] ??= i.message;
    return { status: "error", message: "Revisá los datos.", fieldErrors };
  }
  const { email, role } = parsed.data;
  const db = createSupabaseAdminClient();

  const existing = await findAuthUserByEmail(email);
  let userId: string;
  let invited = false;

  if (existing) {
    userId = existing.id;
    if (isBanned(existing)) {
      const { error } = await db.auth.admin.updateUserById(existing.id, { ban_duration: "none" });
      if (error) return { status: "error", message: `No se pudo rehabilitar: ${error.message}` };
    }
    if (!existing.last_sign_in_at) {
      const { error } = await sendInvite(email);
      if (error) console.error("[users] reinvite:", error.message);
      invited = !error;
    }
  } else {
    const { data, error } = await sendInvite(email);
    if (error || !data.user) {
      console.error("[users] invite:", error?.status, error?.message);
      const message =
        error?.status === 429
          ? "Se alcanzó el límite de emails por hora. Probá más tarde o configurá el SMTP de Resend."
          : "No se pudo enviar la invitación. Revisá la configuración de email de Supabase.";
      return { status: "error", message };
    }
    userId = data.user.id;
    invited = true;
  }

  const { error: roleError } = await db
    .from("user_roles")
    .upsert({ user_id: userId, role }, { onConflict: "user_id" });
  if (roleError)
    return { status: "error", message: `No se pudo asignar el rol: ${roleError.message}` };

  await audit(admin.user.id, invited ? "user_invite" : "user_role_set", { email, role });
  revalidatePath(USERS_PATH);
  return {
    status: "done",
    message: invited
      ? `Invitación enviada a ${email} como ${role === "admin" ? "administrador" : "editor"}.`
      : `${email} ya tenía cuenta: ahora tiene rol ${role === "admin" ? "administrador" : "editor"}.`,
  };
}

/** Reenvía la invitación a un usuario que todavía no ingresó. */
export async function resendInvite(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.state;

  const userId = String(formData.get("userId") ?? "");
  const db = createSupabaseAdminClient();
  const { data, error } = await db.auth.admin.getUserById(userId);
  if (error || !data.user?.email) return { status: "error", message: "Usuario no encontrado." };
  if (data.user.last_sign_in_at) {
    return {
      status: "error",
      message: "Ya ingresó: si no recuerda la contraseña, que use “¿Olvidaste tu contraseña?”.",
    };
  }

  const { error: inviteError } = await sendInvite(data.user.email);
  if (inviteError) {
    console.error("[users] resend:", inviteError.status, inviteError.message);
    return { status: "error", message: "No se pudo reenviar la invitación." };
  }
  await audit(admin.user.id, "user_invite_resend", { email: data.user.email });
  return { status: "done", message: `Invitación reenviada a ${data.user.email}.` };
}

/** Cambia el rol o quita el acceso (role = "none": borra el rol y bloquea el login). */
export async function setUserRole(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.state;

  const userId = String(formData.get("userId") ?? "");
  const raw = String(formData.get("role") ?? "");
  const nextRole: RoleChange = raw === "none" ? "none" : roleSchema.parse(raw);
  const db = createSupabaseAdminClient();

  const [{ data: target }, { data: current }, adminCount] = await Promise.all([
    db.auth.admin.getUserById(userId),
    db.from("user_roles").select("role").eq("user_id", userId).maybeSingle(),
    countAdmins(),
  ]);
  if (!target?.user) return { status: "error", message: "Usuario no encontrado." };

  const guard = checkRoleChange({
    actorId: admin.user.id,
    targetId: userId,
    targetCurrentRole: (current?.role as "admin" | "editor" | undefined) ?? null,
    nextRole,
    adminCount,
  });
  if (!guard.ok) return { status: "error", message: guard.reason };

  const email = target.user.email ?? userId;
  if (nextRole === "none") {
    const { error } = await db.from("user_roles").delete().eq("user_id", userId);
    if (error) return { status: "error", message: `No se pudo quitar el rol: ${error.message}` };
    const { error: banError } = await db.auth.admin.updateUserById(userId, {
      ban_duration: BAN_FOREVER,
    });
    if (banError) console.error("[users] ban:", banError.message);
    await audit(admin.user.id, "user_remove", { email });
    revalidatePath(USERS_PATH);
    return { status: "done", message: `${email} ya no tiene acceso al panel.` };
  }

  const { error } = await db
    .from("user_roles")
    .upsert({ user_id: userId, role: nextRole }, { onConflict: "user_id" });
  if (error) return { status: "error", message: `No se pudo cambiar el rol: ${error.message}` };
  if (isBanned(target.user)) {
    await db.auth.admin.updateUserById(userId, { ban_duration: "none" });
  }
  await audit(admin.user.id, "user_role_set", { email, role: nextRole });
  revalidatePath(USERS_PATH);
  return {
    status: "done",
    message: `${email} ahora es ${nextRole === "admin" ? "administrador" : "editor"}.`,
  };
}
