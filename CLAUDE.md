# Ankor Bio — sitio + plataforma de COAs

## Regla inmutable

Toda URL en inventory.json debe responder 200, application/pdf y el mismo SHA-256.
No cambiar, renombrar ni mover nada bajo /private-info/ ni /coa/ (lotes nuevos). Correr `pnpm verify:urls` antes de cada merge a main.

## Stack

Next.js (App Router) · TypeScript · Tailwind · shadcn/ui · Supabase (Auth, Postgres, Storage) · Resend · Vercel · @react-pdf/renderer · qrcode · Zod

## Estructura

- app/(site) — sitio público con design system Medlume
- app/admin — panel (protegido)
- app/private-info/[file]/route.ts y app/coa/[file]/route.ts — sirven PDFs (mismo handler), no tocar sin tests
- lib/pdf — plantilla COA (misma para preview y PDF final)
- scripts/ — import-legacy.ts, verify-urls.ts
- supabase/migrations — esquema y RLS

## Convenciones

- file_name y url_prefix son inmutables; file_name es case-sensitive
- Nunca borrar document_versions
- Tokens de diseño solo desde globals.css, sin hex sueltos en componentes

@AGENTS.md
