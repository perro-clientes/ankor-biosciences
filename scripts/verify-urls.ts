/**
 * pnpm verify:urls [baseUrl ...]
 *
 * Recorre inventory.json y pide cada URL de /private-info/ a cada baseUrl.
 * Pasa solo si TODAS responden 200 (sin redirects), application/pdf y el
 * mismo SHA-256. Además chequea que un archivo inexistente dé 404 y que la
 * carpeta no se liste. Sale con código 1 ante cualquier falla.
 *
 * Ejemplos:
 *   pnpm verify:urls                                  # http://localhost:3000
 *   pnpm verify:urls https://ankor-bio-git-x.vercel.app
 *   pnpm verify:urls https://ankor-bio.com https://www.ankor-bio.com
 *
 * Previews protegidos por Vercel: exportar VERCEL_BYPASS=<token> (Protection Bypass).
 * Si el DNS no se cambia hasta que esto dé 12/12 en preview, no se rompe ningún QR.
 */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";

type Entry = { fileName: string; path: string; bytes: number; sha256: string };

const inventory = JSON.parse(readFileSync(join(__dirname, "..", "inventory.json"), "utf8")) as {
  files: Entry[];
};

const bases = (
  process.argv.slice(2).length ? process.argv.slice(2) : ["http://localhost:3000"]
).map((b) => b.replace(/\/+$/, ""));

const headers: Record<string, string> = { "User-Agent": "ankor-verify-urls" };
if (process.env.VERCEL_BYPASS) headers["x-vercel-protection-bypass"] = process.env.VERCEL_BYPASS;

type Result = { url: string; ok: boolean; detail: string };

async function check(url: string, entry: Entry): Promise<Result> {
  try {
    const res = await fetch(url, { redirect: "manual", headers });
    if (res.status !== 200) {
      const loc = res.headers.get("location");
      return { url, ok: false, detail: `status ${res.status}${loc ? ` → ${loc}` : ""}` };
    }
    const type = res.headers.get("content-type") ?? "";
    if (!type.startsWith("application/pdf")) {
      return { url, ok: false, detail: `content-type ${type || "(vacío)"}` };
    }
    const body = Buffer.from(await res.arrayBuffer());
    const hash = createHash("sha256").update(body).digest("hex");
    if (hash !== entry.sha256) {
      return {
        url,
        ok: false,
        detail: `sha256 distinto (${body.byteLength} B, esperado ${entry.bytes} B)`,
      };
    }
    return { url, ok: true, detail: `${body.byteLength} B` };
  } catch (error) {
    return { url, ok: false, detail: `error de red: ${(error as Error).message}` };
  }
}

/**
 * Chequeo negativo. Con `follow`, sigue redirects y evalúa el destino final
 * (Next redirige /private-info/ → /private-info con 308 y ahí da 404).
 */
async function expectStatus(url: string, allowed: number[], follow = false): Promise<Result> {
  try {
    const res = await fetch(url, { redirect: follow ? "follow" : "manual", headers });
    const ok = allowed.includes(res.status);
    const via = res.redirected ? ` en ${res.url}` : "";
    return { url, ok, detail: `status ${res.status}${via} (esperado ${allowed.join(" o ")})` };
  } catch (error) {
    return { url, ok: false, detail: `error de red: ${(error as Error).message}` };
  }
}

async function main() {
  let failures = 0;
  for (const base of bases) {
    console.log(`\n${base}`);
    const results = await Promise.all(
      inventory.files.map((entry) => check(`${base}${entry.path}`, entry)),
    );
    for (const r of results) {
      console.log(`  ${r.ok ? "✓" : "✗"} ${r.url.replace(base, "")}  ${r.detail}`);
    }
    const passed = results.filter((r) => r.ok).length;
    failures += results.length - passed;

    const negatives = await Promise.all([
      expectStatus(`${base}/private-info/AnkorBiosciences-COA-NoExiste-PDFforQrCode.pdf`, [404]),
      // La carpeta nunca se lista.
      expectStatus(`${base}/private-info/`, [403, 404], true),
    ]);
    for (const r of negatives) {
      console.log(`  ${r.ok ? "✓" : "✗"} ${r.url.replace(base, "")}  ${r.detail}`);
      if (!r.ok) failures++;
    }
    console.log(`  → ${passed}/${results.length} PDFs OK`);
  }

  if (failures > 0) {
    console.error(`\n✗ ${failures} chequeo(s) fallaron. No cambiar el DNS ni mergear.`);
    process.exit(1);
  }
  console.log("\n✓ Todas las URLs de inventory.json responden igual que en el cPanel.");
}

main();
