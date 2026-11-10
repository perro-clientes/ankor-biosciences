/** Formatos de usuario compartidos por servidor y cliente. */

export const ROLE_LABEL = { admin: "Administrador", editor: "Editor" } as const;

/** Iniciales a partir del email: "ana.perez@…" → "AP", "fede@…" → "FE". */
export function initialsFor(email: string): string {
  const local = email.split("@")[0] ?? "";
  const parts = local.split(/[._+-]+/).filter(Boolean);
  const letters = parts.length > 1 ? parts[0][0] + parts[1][0] : local.slice(0, 2);
  return (letters || "?").toUpperCase();
}

export const USER_STATUS_LABEL = {
  activo: "Activo",
  pendiente: "Invitación pendiente",
  "sin-acceso": "Sin acceso",
} as const;
