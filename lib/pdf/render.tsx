import { createHash } from "node:crypto";
import { renderToBuffer } from "@react-pdf/renderer";
import { CoaDocument, type CoaDocumentProps } from "./coa-document";
import { coaSchema } from "./coa-schema";
import { registerPdfFonts } from "./fonts";
import { PlaceholderDocument } from "./placeholder-document";

export type RenderedPdf = { bytes: Uint8Array; sha256: string; size: number };

function finish(buffer: Buffer): RenderedPdf {
  const bytes = new Uint8Array(buffer);
  return {
    bytes,
    sha256: createHash("sha256").update(bytes).digest("hex"),
    size: bytes.byteLength,
  };
}

/** Genera el PDF del COA. Valida con Zod antes: nunca se genera un COA inválido. */
export async function renderCoaPdf(props: CoaDocumentProps): Promise<RenderedPdf> {
  const data = coaSchema.parse(props.data);
  registerPdfFonts();
  return finish(await renderToBuffer(<CoaDocument {...props} data={data} />));
}

/** Genera el PDF placeholder de un lote nuevo. */
export async function renderPlaceholderPdf(lotLabel?: string): Promise<RenderedPdf> {
  registerPdfFonts();
  return finish(await renderToBuffer(<PlaceholderDocument lotLabel={lotLabel} />));
}
