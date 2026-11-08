/**
 * pnpm render:coa [outDir]
 *
 * Genera con la plantilla el COA del Lote X (datos de lib/pdf/fixtures/lote-x.ts)
 * y el PDF placeholder, para compararlos con los originales de legacy/.
 * Salida por defecto: .coa-preview/ (ignorada por git).
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { loteX } from "../lib/pdf/fixtures/lote-x";
import { renderCoaPdf, renderPlaceholderPdf } from "../lib/pdf/render";

async function main() {
  const outDir = process.argv[2] ?? join(process.cwd(), ".coa-preview");
  mkdirSync(outDir, { recursive: true });

  const coa = await renderCoaPdf({ data: loteX });
  writeFileSync(join(outDir, "lote-x.pdf"), coa.bytes);
  console.log(`lote-x.pdf        ${coa.size} B  sha256 ${coa.sha256.slice(0, 12)}…`);

  const placeholder = await renderPlaceholderPdf("Lote XII");
  writeFileSync(join(outDir, "placeholder.pdf"), placeholder.bytes);
  console.log(`placeholder.pdf   ${placeholder.size} B`);

  console.log(`\nComparar con legacy/private-info/AnkorBiosciences-COA-LoteX-PDFforQrCode.pdf`);
  console.log(`y legacy/private-info/AnkorBiosciences-COA2020-LotePrueba-PDFforQrCode.pdf`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
