/**
 * Reglas para administrar usuarios (sin dependencias, testeables).
 * Objetivo: que el panel nunca quede sin ningún admin.
 */

export type RoleChange = "admin" | "editor" | "none";

export function checkRoleChange(opts: {
  actorId: string;
  targetId: string;
  targetCurrentRole: "admin" | "editor" | null;
  nextRole: RoleChange;
  adminCount: number;
}): { ok: true } | { ok: false; reason: string } {
  const { actorId, targetId, targetCurrentRole, nextRole, adminCount } = opts;

  if (actorId === targetId && nextRole !== "admin") {
    return {
      ok: false,
      reason: "No podés quitarte el rol de administrador a vos mismo. Pedíselo a otro admin.",
    };
  }
  if (targetCurrentRole === "admin" && nextRole !== "admin" && adminCount <= 1) {
    return { ok: false, reason: "Tiene que quedar al menos un administrador." };
  }
  return { ok: true };
}
