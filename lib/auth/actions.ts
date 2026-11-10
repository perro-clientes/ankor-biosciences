"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { emailCallbackUrl } from "./origin";
import { HOME_PATH, LOGIN_PATH, PASSWORD_PATH, safeNextPath } from "./routing";
import { emailSchema, loginSchema, newPasswordSchema } from "./schemas";

export type FormState =
  | { status: "idle" }
  | { status: "done"; message: string }
  | { status: "error"; message: string; fieldErrors?: Record<string, string> };

function firstErrors(issues: { path: PropertyKey[]; message: string }[]) {
  const out: Record<string, string> = {};
  for (const issue of issues) {
    const key = String(issue.path[0] ?? "form");
    out[key] ??= issue.message;
  }
  return out;
}

/** Login con email y contraseña. Mensaje genérico: no revela si el email existe. */
export async function signIn(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: "Revisá los datos.",
      fieldErrors: firstErrors(parsed.error.issues),
    };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    if (error.status === 429) {
      return { status: "error", message: "Demasiados intentos. Esperá unos minutos." };
    }
    if (!/invalid login credentials|email not confirmed/i.test(error.message)) {
      console.error("[auth] signInWithPassword:", error.status, error.message);
    }
    return { status: "error", message: "Email o contraseña incorrectos." };
  }

  redirect(safeNextPath(String(formData.get("next") ?? "")));
}

/** Pide el link para restablecer la contraseña. Misma respuesta exista o no la cuenta. */
export async function requestPasswordReset(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) {
    return {
      status: "error",
      message: "Ingresá un email válido.",
      fieldErrors: { email: "Ingresá un email válido." },
    };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
    redirectTo: await emailCallbackUrl(PASSWORD_PATH),
  });
  if (error) {
    console.error("[auth] resetPasswordForEmail:", error.status, error.message);
    if (error.status === 429) {
      return { status: "error", message: "Demasiados intentos. Esperá unos minutos." };
    }
  }

  return {
    status: "done",
    message: `Si ${parsed.data} tiene acceso al panel, te mandamos un link para elegir una contraseña nueva. Vence en 1 hora.`,
  };
}

/** Define la contraseña (primera vez desde la invitación, o recupero). Requiere sesión. */
export async function updatePassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = newPasswordSchema.safeParse({
    password: formData.get("password"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: "Revisá la contraseña.",
      fieldErrors: firstErrors(parsed.error.issues),
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect(LOGIN_PATH);

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    console.error("[auth] updateUser:", error.status, error.message);
    const message = /same.*password|different from the old/i.test(error.message)
      ? "La contraseña nueva tiene que ser distinta de la anterior."
      : /weak|pwned|leaked/i.test(error.message)
        ? "Esa contraseña es demasiado común o apareció en filtraciones. Elegí otra."
        : "No pudimos guardar la contraseña. Probá de nuevo.";
    return { status: "error", message, fieldErrors: { password: message } };
  }

  redirect(`${HOME_PATH}?password=ok`);
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect(LOGIN_PATH);
}
