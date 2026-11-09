import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import {
  HOME_PATH,
  LOGIN_PATH,
  PASSWORD_PATH,
  needsPasswordSetup,
  safeNextPath,
} from "@/lib/auth/routing";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Destino de los links de email (invitación y recupero de contraseña).
 * Acepta los dos formatos de Supabase:
 * - ?token_hash=…&type=invite|recovery  (plantillas de email personalizadas;
 *   funciona aunque el link se abra en otro navegador o dispositivo)
 * - ?code=…                             (flujo PKCE; mismo navegador)
 * Invitación y recupero terminan en "elegir contraseña".
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");
  const fallback = needsPasswordSetup(type) ? PASSWORD_PATH : HOME_PATH;
  const next = safeNextPath(searchParams.get("next"), fallback);

  const supabase = await createSupabaseServerClient();
  let ok = false;

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (error) console.error("[auth] verifyOtp:", error.message);
    ok = !error;
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) console.error("[auth] exchangeCodeForSession:", error.message);
    ok = !error;
  }

  const target = new URL(ok ? next : `${LOGIN_PATH}?error=link`, request.url);
  return NextResponse.redirect(target);
}
