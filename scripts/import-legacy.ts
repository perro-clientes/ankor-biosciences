/**
 * pnpm import:legacy [--dry-run]
 *
 * Sube los 12 PDFs de legacy/private-info/ a Supabase Storage (bucket coa-pdfs)
 * y crea, por cada uno, su documento (kind = legacy) con el PDF como versión 1
 * publicada. Idempotente: si el file_name ya existe, lo saltea.
 *
 * Requiere las migraciones de la tarea 3 (documents, document_versions, bucket)
 * y en el entorno: NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY.
 * Cargar con: pnpm import:legacy --env-file=.env.local  (o exportarlas antes).
 *
 * ⚠️ Todavía no se corrió: el esquema real puede pedir ajustar nombres de columnas.
 */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";

const BUCKET = "coa-pdfs";
const dryRun = process.argv.includes("--dry-run");

type Entry = { fileName: string; bytes: number; sha256: string; lastModified: string | null };
const root = join(__dirname, "..");
const inventory = JSON.parse(readFileSync(join(root, "inventory.json"), "utf8")) as {
  files: Entry[];
};

/** "AnkorBiosciences-COA-LoteXI-PDFforQrCode.pdf" → "Lote XI"; "…COA2020-V2…" → "COA 2020 V2". */
function labelFor(fileName: string): string {
  const core = fileName.replace(/^AnkorBiosciences-/, "").replace(/-PDFforQrCode\.pdf$/, "");
  const parts = core.split("-").filter((p) => p !== "COA");
  const pretty = parts.map((p) =>
    p.replace(/^Lote(.+)$/, "Lote $1").replace(/^COA(\d{4})$/, "COA $1"),
  );
  return pretty.length ? pretty.join(" ") : "COA 2019";
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!dryRun && (!url || !key)) {
    console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.");
    process.exit(1);
  }
  const db = dryRun ? null : createClient(url!, key!, { auth: { persistSession: false } });

  let created = 0;
  let skipped = 0;
  for (const entry of inventory.files) {
    const bytes = readFileSync(join(root, "legacy", "private-info", entry.fileName));
    const hash = createHash("sha256").update(bytes).digest("hex");
    if (hash !== entry.sha256 || bytes.byteLength !== entry.bytes) {
      throw new Error(`${entry.fileName}: el archivo en legacy/ no coincide con inventory.json`);
    }
    const label = labelFor(entry.fileName);

    if (!db) {
      console.log(`[dry-run] ${entry.fileName} → "${label}" (${entry.bytes} B)`);
      continue;
    }

    const { data: existing, error: findError } = await db
      .from("documents")
      .select("id")
      .eq("file_name", entry.fileName)
      .maybeSingle();
    if (findError) throw findError;
    if (existing) {
      console.log(`= ${entry.fileName} ya existe, se saltea`);
      skipped++;
      continue;
    }

    const { data: doc, error: docError } = await db
      .from("documents")
      .insert({ file_name: entry.fileName, label, kind: "legacy", status: "publicado" })
      .select("id")
      .single();
    if (docError) throw docError;

    const pdfPath = `documents/${doc.id}/v1.pdf`;
    const { error: upError } = await db.storage
      .from(BUCKET)
      .upload(pdfPath, bytes, { contentType: "application/pdf", upsert: false });
    if (upError) throw upError;

    const { data: version, error: vError } = await db
      .from("document_versions")
      .insert({
        document_id: doc.id,
        version: 1,
        data: null,
        template_version: null,
        pdf_path: pdfPath,
        sha256: entry.sha256,
        size_bytes: entry.bytes,
        published_at: entry.lastModified ?? new Date().toISOString(),
        published_by: null,
      })
      .select("id")
      .single();
    if (vError) throw vError;

    const { error: pubError } = await db
      .from("documents")
      .update({ published_version_id: version.id })
      .eq("id", doc.id);
    if (pubError) throw pubError;

    console.log(`+ ${entry.fileName} → "${label}" (${pdfPath})`);
    created++;
  }

  console.log(
    dryRun ? "\nDry run: no se escribió nada." : `\n${created} creados, ${skipped} salteados.`,
  );
  if (!dryRun) console.log("Siguiente paso: pnpm verify:urls <url del preview>");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
