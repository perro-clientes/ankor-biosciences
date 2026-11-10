/**
 * /coa/[file] — URL de los QR de los lotes nuevos (ej. /coa/lote-xii.pdf).
 *
 * ⚠️ REGLA INMUTABLE (CLAUDE.md): igual que /private-info, lo que se imprime no
 *    puede dejar de responder. Mismo handler y mismos tests.
 *
 * Las dos rutas (/coa y /private-info) encuentran cualquier documento por su
 * file_name: el QR usa la ruta guardada en documents.url_prefix, pero un error
 * de tipeo o de configuración nunca deja un QR sin respuesta.
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
