import { z } from "zod";

/** Mínimo de la contraseña. Configurar lo mismo en Supabase (Auth → Providers → Email). */
export const PASSWORD_MIN = 10;

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Ingresá un email válido.")
  .max(254);

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Ingresá tu contraseña.").max(200),
});

export const newPasswordSchema = z
  .object({
    password: z
      .string()
      .min(PASSWORD_MIN, `La contraseña tiene que tener al menos ${PASSWORD_MIN} caracteres.`)
      .max(200, "La contraseña es demasiado larga."),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, {
    message: "Las contraseñas no coinciden.",
    path: ["confirm"],
  });

export const roleSchema = z.enum(["admin", "editor"]);

export const inviteSchema = z.object({
  email: emailSchema,
  role: roleSchema,
});
