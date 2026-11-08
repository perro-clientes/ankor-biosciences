/**
 * /private-info/[file] — sirve los PDFs de los QR impresos.
 *
 * ⚠️ REGLA INMUTABLE (CLAUDE.md): no tocar sin tests. Antes de mergear a main:
 *    pnpm test && pnpm verify:urls <url del preview>
 *
 * La lógica vive en lib/private-info/handler.ts (testeada con Vitest).
 * Caché: la búsqueda en Postgres está cacheada por documento (cacheTag) y se
 * invalida al publicar; el navegador revalida por ETag. No hay caché de CDN
 * para el PDF todavía: se puede sumar cuando haya tráfico que lo justifique.
 */
import { handlePrivateInfo } from "@/lib/private-info/handler";
import { supabaseSource } from "@/lib/private-info/supabase-source";

type Context = { params: Promise<{ file: string }> };

export async function GET(request: Request, { params }: Context) {
  const { file } = await params;
  return handlePrivateInfo(request, file, supabaseSource);
}

export async function HEAD(request: Request, { params }: Context) {
  const { file } = await params;
  return handlePrivateInfo(request, file, supabaseSource);
}
