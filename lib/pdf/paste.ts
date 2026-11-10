/**
 * Convierte un rango copiado de Excel / Google Sheets (tabs) o un CSV en una
 * grilla de texto. Los valores se respetan tal cual ("ND", vacíos, decimales).
 * Todas las filas quedan con la misma cantidad de columnas.
 */

function splitRow(line: string): string[] {
  if (line.includes("\t")) return line.split("\t");
  const cells: string[] = [];
  let current = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (quoted && line[i + 1] === '"') {
        current += '"';
        i++;
      } else quoted = !quoted;
    } else if ((char === "," || char === ";") && !quoted) {
      cells.push(current);
      current = "";
    } else current += char;
  }
  cells.push(current);
  return cells;
}

export function parseGrid(text: string): string[][] {
  const rows = text
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .filter((line) => line.trim() !== "")
    .map((line) => splitRow(line).map((cell) => cell.trim()));
  const width = Math.max(0, ...rows.map((r) => r.length));
  return rows.map((r) => [...r, ...Array.from({ length: width - r.length }, () => "")]);
}

/** Avisos útiles al pegar: celdas "-THC" sin Δ (pasaba en PDFs viejos). */
export function pasteWarnings(grid: string[][]): string[] {
  const warnings: string[] = [];
  grid.forEach((row, r) =>
    row.forEach((cell) => {
      if (/^-\s*THC$/i.test(cell)) {
        warnings.push(`Fila ${r + 1}: "${cell}" parece Δ-8-THC o Δ-9-THC sin el símbolo Δ.`);
      }
    }),
  );
  return warnings;
}
