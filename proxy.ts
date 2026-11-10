import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { adminRedirect } from "@/lib/auth/routing";
import { supabasePublicEnv } from "@/lib/supabase/env";

/**
 * Proxy SOLO para /admin (ver matcher): refresca la sesión de Supabase y manda
 * al login si no hay sesión. No corre en /private-info ni en el sitio público.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const { url, anonKey } = supabasePublicEnv();

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // getClaims valida el JWT (y refresca la sesión si venció) sin consultar la base.
  const { data } = await supabase.auth.getClaims();
  const target = adminRedirect(request.nextUrl.pathname, Boolean(data?.claims?.sub));
  if (!target) return response;

  const redirect = NextResponse.redirect(new URL(target, request.url));
  // Conservar las cookies de sesión refrescadas en la redirección.
  for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie);
  return redirect;
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
