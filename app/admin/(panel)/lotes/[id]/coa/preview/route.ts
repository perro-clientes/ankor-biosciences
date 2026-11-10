import { NextResponse, type NextRequest } from "next/server";
import { getAdminUser } from "@/lib/auth/session";
import { coaSchema, describeIssues } from "@/lib/pdf/coa-schema";
import { renderCoaPdf } from "@/lib/pdf/render";

/**
 * Vista previa del COA: recibe el documento del editor (JSON) y devuelve el PDF
 * con la misma plantilla que se publica, marcado "PREVIEW". No guarda nada.
 * Si no es válido responde 422 con los problemas.
 */
export async function POST(request: NextRequest) {
  const user = await getAdminUser();
  if (!user?.role) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const body = await request.text();
  if (body.length > 300_000) return NextResponse.json({ error: "too_large" }, { status: 413 });

  let input: unknown;
  try {
    input = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = coaSchema.safeParse(input);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid", issues: describeIssues(parsed.error.issues) },
      { status: 422 },
    );
  }

  const pdf = await renderCoaPdf({ data: parsed.data, preview: true });
  return new NextResponse(new Uint8Array(pdf.bytes), {
    headers: { "Content-Type": "application/pdf", "Cache-Control": "private, no-store" },
  });
}
