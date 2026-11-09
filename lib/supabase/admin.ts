import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { supabasePublicEnv } from "./env";

/**
 * Cliente con la service role: saltea RLS. Solo en el servidor, y siempre
 * después de verificar el rol del usuario (requireRole). Nunca exponerlo.
 */
let client: SupabaseClient | null = null;

export function createSupabaseAdminClient(): SupabaseClient {
  if (client) return client;
  const { url } = supabasePublicEnv();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("Falta SUPABASE_SERVICE_ROLE_KEY.");
  client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return client;
}
