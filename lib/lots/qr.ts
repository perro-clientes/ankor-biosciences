import QRCode from "qrcode";
import { publicPdfUrl, type UrlPrefix } from "./naming";

/**
 * QR de un lote. Codifica SIEMPRE la URL final de producción
 * (https://ankor-bio.com/<prefijo>/<file_name>), no la del entorno actual:
 * lo que se imprime tiene que seguir funcionando para siempre.
 *
 * Nivel de corrección Q (~25 %) y zona de silencio de 4 módulos, como pide el spec.
 */

export const QR_OPTIONS = { errorCorrectionLevel: "Q" as const, margin: 4 };
export const QR_PNG_SIZE = 2048;
export { publicPdfUrl };

export async function qrSvg(fileName: string, prefix: UrlPrefix): Promise<string> {
  return QRCode.toString(publicPdfUrl(fileName, prefix), {
    ...QR_OPTIONS,
    type: "svg",
    color: { dark: "#000000", light: "#ffffff" },
  });
}

export async function qrPng(fileName: string, prefix: UrlPrefix): Promise<Buffer> {
  return QRCode.toBuffer(publicPdfUrl(fileName, prefix), {
    ...QR_OPTIONS,
    type: "png",
    width: QR_PNG_SIZE,
    color: { dark: "#000000", light: "#ffffff" },
  });
}

/** "lote-xii.pdf" → "QR-lote-xii.svg"; "…-COA-LoteXI-PDFforQrCode.pdf" → "QR-…-COA-LoteXI.svg" */
export function qrDownloadName(fileName: string, ext: "svg" | "png"): string {
  return `QR-${fileName.replace(/-PDFforQrCode\.pdf$|\.pdf$/, "")}.${ext}`;
}
