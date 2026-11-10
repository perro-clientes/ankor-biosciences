import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth/session";
import { versionPdf } from "@/lib/coa/service";

/** PDF de una versión puntual (publicada o no), para revisarla desde el panel. */
export async function GET(
  _request: Request,
  ctx: RouteContext<"/admin/lotes/[id]/versiones/[version]/pdf">,
) {
  const user = await getAdminUser();
  if (!user?.role) return new NextResponse("Forbidden", { status: 403 });

  const { id, version } = await ctx.params;
  const n = Number(version);
  if (!/^[0-9a-f-]{36}$/i.test(id) || !Number.isInteger(n) || n < 1) {
    return new NextResponse("Not found", { status: 404 });
  }
  const bytes = await versionPdf(id, n);
  if (!bytes) return new NextResponse("Not found", { status: 404 });

  return new NextResponse(bytes, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="v${n}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
