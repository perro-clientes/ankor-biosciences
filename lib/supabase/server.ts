import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabasePublicEnv } from "./env";

/**
 * Cliente de Supabase con la sesión del usuario (cookies). Respeta RLS: es el
 * que usa el panel. Para Storage y /private-info se usa la service role aparte.
 */
export async function createSupabaseServerClient() {
  const { url, anonKey } = supabasePublicEnv();
  const cookieStore = await cookies();
  return createServerClient(url, anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Llamado desde un Server Component: no puede escribir cookies.
          // El proxy (proxy.ts) ya refresca la sesión en cada request a /admin.
        }
      },
    },
  });
}
