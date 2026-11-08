# Snapshot del sitio anterior (solo lectura)

`private-info/` contiene los 12 PDFs que servía ankor-bio.com (cPanel) en
`/private-info/`, byte a byte. Se verificaron contra las URLs públicas el
2026-11-08: los 12 coinciden por SHA-256.

- **No editar, renombrar ni borrar.** Son la fuente de `scripts/import-legacy.ts`
  y la referencia de `inventory.json` (raíz del repo).
- No están en `public/`: el sitio los sirve desde Supabase vía
  `app/private-info/[file]/route.ts`, no como estáticos.

Pendiente del cPanel: `.htaccess` (puede tener redirects que hoy hacen andar algún QR).
