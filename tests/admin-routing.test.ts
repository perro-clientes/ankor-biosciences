/**
 * Reglas de navegación del panel (proxy y callback del magic link).
 */
import { describe, expect, it } from "vitest";
import {
  adminRedirect,
  isPublicAdminPath,
  needsPasswordSetup,
  PASSWORD_PATH,
  safeNextPath,
} from "@/lib/auth/routing";

describe("adminRedirect (proxy)", () => {
  it("sin sesión, /admin y subrutas van al login con ?next", () => {
    expect(adminRedirect("/admin", false)).toBe("/admin/login?next=%2Fadmin");
    expect(adminRedirect("/admin/lotes/123", false)).toBe(
      "/admin/login?next=%2Fadmin%2Flotes%2F123",
    );
  });

  it("el login y el callback son públicos", () => {
    expect(adminRedirect("/admin/login", false)).toBeNull();
    expect(adminRedirect("/admin/auth/confirm", false)).toBeNull();
    expect(adminRedirect("/admin/auth/confirm", true)).toBeNull();
  });

  it("con sesión, el login redirige al panel", () => {
    expect(adminRedirect("/admin/login", true)).toBe("/admin");
    expect(adminRedirect("/admin", true)).toBeNull();
  });

  it("nunca actúa fuera de /admin (ni en /private-info)", () => {
    expect(
      adminRedirect("/private-info/AnkorBiosciences-COA-LoteX-PDFforQrCode.pdf", false),
    ).toBeNull();
    expect(adminRedirect("/", false)).toBeNull();
    expect(adminRedirect("/contact", false)).toBeNull();
  });
});

describe("safeNextPath (evita open redirects)", () => {
  it.each([
    [null, "/admin"],
    ["", "/admin"],
    ["/admin/lotes?id=1", "/admin/lotes?id=1"],
    ["https://evil.com", "/admin"],
    ["//evil.com", "/admin"],
    ["/admin\\@evil.com", "/admin"],
    ["/contact", "/admin"],
    ["/admin/login", "/admin"],
    ["/admin/auth/confirm?x=1", "/admin"],
    ["/admin/../private-info/x.pdf", "/admin"],
    ["/administrador", "/admin"],
    ["/admin/%2e%2e/contact", "/admin"],
  ])("%s → %s", (input, expected) => {
    expect(safeNextPath(input)).toBe(expected);
  });

  it("isPublicAdminPath", () => {
    expect(isPublicAdminPath("/admin/login")).toBe(true);
    expect(isPublicAdminPath("/admin/auth/confirm")).toBe(true);
    expect(isPublicAdminPath("/admin")).toBe(false);
  });
});

describe("recupero e invitaciones", () => {
  it("/admin/recuperar es público y con sesión vuelve al panel", () => {
    expect(isPublicAdminPath("/admin/recuperar")).toBe(true);
    expect(adminRedirect("/admin/recuperar", false)).toBeNull();
    expect(adminRedirect("/admin/recuperar", true)).toBe("/admin");
  });

  it("elegir contraseña requiere sesión", () => {
    expect(adminRedirect("/admin/perfil", false)).toBe("/admin/login?next=%2Fadmin%2Fperfil");
    expect(safeNextPath(PASSWORD_PATH)).toBe("/admin/perfil?contrasena=nueva");
  });

  it("invitación y recupero llevan a elegir contraseña", () => {
    expect(needsPasswordSetup("invite")).toBe(true);
    expect(needsPasswordSetup("recovery")).toBe(true);
    expect(needsPasswordSetup("email")).toBe(false);
    expect(needsPasswordSetup(null)).toBe(false);
    expect(safeNextPath(null, PASSWORD_PATH)).toBe(PASSWORD_PATH);
    expect(safeNextPath("https://evil.com", PASSWORD_PATH)).toBe(PASSWORD_PATH);
  });
});
