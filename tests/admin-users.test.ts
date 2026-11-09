/**
 * Reglas de administración de usuarios y validaciones de contraseña.
 */
import { describe, expect, it } from "vitest";
import { checkRoleChange } from "@/lib/auth/guards";
import { PASSWORD_MIN, inviteSchema, loginSchema, newPasswordSchema } from "@/lib/auth/schemas";

const base = { actorId: "a", targetId: "b", targetCurrentRole: "editor" as const, adminCount: 2 };

describe("checkRoleChange", () => {
  it("un admin puede cambiar el rol o quitar el acceso a otro", () => {
    expect(checkRoleChange({ ...base, nextRole: "admin" }).ok).toBe(true);
    expect(checkRoleChange({ ...base, nextRole: "none" }).ok).toBe(true);
  });

  it("nadie se quita el rol de admin a sí mismo", () => {
    const self = { ...base, targetId: "a", targetCurrentRole: "admin" as const };
    expect(checkRoleChange({ ...self, nextRole: "editor" }).ok).toBe(false);
    expect(checkRoleChange({ ...self, nextRole: "none" }).ok).toBe(false);
  });

  it("siempre queda al menos un admin", () => {
    const lastAdmin = { ...base, targetCurrentRole: "admin" as const, adminCount: 1 };
    expect(checkRoleChange({ ...lastAdmin, nextRole: "none" }).ok).toBe(false);
    expect(checkRoleChange({ ...lastAdmin, nextRole: "editor" }).ok).toBe(false);
    expect(checkRoleChange({ ...lastAdmin, adminCount: 2, nextRole: "none" }).ok).toBe(true);
  });
});

describe("schemas", () => {
  it("contraseña nueva: mínimo y confirmación", () => {
    const ok = "x".repeat(PASSWORD_MIN);
    expect(newPasswordSchema.safeParse({ password: ok, confirm: ok }).success).toBe(true);
    expect(newPasswordSchema.safeParse({ password: "corta", confirm: "corta" }).success).toBe(
      false,
    );
    const mismatch = newPasswordSchema.safeParse({ password: ok, confirm: `${ok}!` });
    expect(mismatch.error?.issues[0].path).toEqual(["confirm"]);
  });

  it("login normaliza el email", () => {
    expect(loginSchema.parse({ email: "  Ana@Ankor-Bio.com ", password: "x" }).email).toBe(
      "ana@ankor-bio.com",
    );
  });

  it("invitación: solo roles válidos", () => {
    expect(inviteSchema.safeParse({ email: "a@b.co", role: "editor" }).success).toBe(true);
    expect(inviteSchema.safeParse({ email: "a@b.co", role: "owner" }).success).toBe(false);
  });
});
