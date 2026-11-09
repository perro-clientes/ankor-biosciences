import { NextResponse, type NextRequest } from "next/server";
import { getAdminUser } from "@/lib/auth/session";
import type { UrlPrefix } from "@/lib/lots/naming";
import { qrDownloadName, qrPng, qrSvg } from "@/lib/lots/qr";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Descarga del QR de un lote: ?format=svg (imprenta) | png (2048 px).
 * Solo editores y admins (el proxy exige sesión; acá se verifica el rol).
 */
export async function GET(request: NextRequest, ctx: RouteContext<"/admin/lotes/[id]/qr">) {
  const user = await getAdminUser();
  if (!user?.role) return new NextResponse("Forbidden", { status: 403 });

  const { id } = await ctx.params;
  const supabase = await createSupabaseServerClient();
  const { data: doc } = await supabase
    .from("documents")
    .select("file_name, url_prefix")
    .eq("id", id)
    .maybeSingle();
  if (!doc) return new NextResponse("Not found", { status: 404 });

  const format = request.nextUrl.searchParams.get("format") === "png" ? "png" : "svg";
  const fileName = doc.file_name as string;
  const prefix = doc.url_prefix as UrlPrefix;
  const download = request.nextUrl.searchParams.get("download") !== "0";

  const body =
    format === "png"
      ? new Uint8Array(await qrPng(fileName, prefix))
      : await qrSvg(fileName, prefix);
  return new NextResponse(body, {
    headers: {
      "Content-Type": format === "png" ? "image/png" : "image/svg+xml; charset=utf-8",
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${qrDownloadName(fileName, format)}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
