import path from "node:path";
import { Font } from "@react-pdf/renderer";
import { fonts } from "./theme";

/**
 * Registra las fuentes embebidas (lib/pdf/fonts/*.ttf). TTF completos: incluyen
 * "Δ". Ruta relativa al cwd del proyecto; en Vercel hay que incluir la carpeta
 * en el bundle de la función (outputFileTracingIncludes en next.config.ts).
 */
let registered = false;

export function registerPdfFonts(fontDir = path.join(process.cwd(), "lib", "pdf", "fonts")) {
  if (registered) return;
  Font.register({
    family: fonts.ui,
    fonts: [
      { src: path.join(fontDir, "Chivo-Regular.ttf"), fontWeight: 400 },
      { src: path.join(fontDir, "Chivo-Bold.ttf"), fontWeight: 700 },
    ],
  });
  Font.register({
    family: fonts.text,
    fonts: [
      { src: path.join(fontDir, "Roboto-Regular.ttf"), fontWeight: 400 },
      { src: path.join(fontDir, "Roboto-Bold.ttf"), fontWeight: 700 },
    ],
  });
  // Sin guiones automáticos: no partir códigos de lote ni nombres de analitos.
  Font.registerHyphenationCallback((word) => [word]);
  registered = true;
}
