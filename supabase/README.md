# Supabase — esquema de la plataforma de COAs

## Cómo aplicar (SQL Editor)

1. **Migración:** abrir `migrations/20261108000000_coa_platform.sql`, pegarlo entero
   en el SQL Editor del proyecto y correrlo. Crea tipos, tablas, triggers, RLS, el
   bucket privado `coa-pdfs` y la plantilla v1. Se corre **una sola vez**.
2. **Chequeos:** pegar `tests/rls_checks.sql` y correrlo. Termina en `ROLLBACK`, no
   deja datos. Si todo está bien, el último mensaje es
   `OK: todos los chequeos de RLS y triggers pasaron`; si algo falla, corta con
   `FALLÓ: <qué chequeo>`.
3. **PDFs legacy:** con `.env.local` completo, desde la raíz del repo:

   ```bash
   pnpm import:legacy --dry-run   # muestra qué va a crear
   pnpm import:legacy             # sube los 12 PDFs y crea documento + versión 1
   ```

   Es idempotente: si se corta, se vuelve a correr y saltea lo que ya existe.

4. **Verificar:** `pnpm dev` y en otra terminal `pnpm verify:urls` → 12/12.

## Configuración del proyecto (Dashboard)

- **Auth → Sign In / Providers:** desactivar "Allow new users to sign up"
  (registro cerrado: solo usuarios invitados). Se usa en la tarea 9 (magic link).
- **Roles:** después de invitar a alguien, darle rol en el SQL Editor:
  `insert into public.user_roles (user_id, role) values ('<uuid>', 'admin');`

## Reglas que garantiza el esquema

| Regla                                                      | Cómo                                             |
| ---------------------------------------------------------- | ------------------------------------------------ |
| `file_name` único, case-sensitive, inmutable               | `unique` + check de patrón + trigger             |
| Las versiones nunca se borran                              | trigger (aplica también a la service role)       |
| Una versión publicada no se modifica                       | trigger: corregir = versión nueva                |
| Un documento publicado no se borra                         | trigger + FK `restrict`                          |
| `published_version_id` apunta a una versión publicada suya | constraint trigger diferido                      |
| `audit_log` de solo agregar                                | trigger                                          |
| Solo usuarios con rol leen/escriben; anon nada             | RLS + `revoke` a anon                            |
| PDFs solo accesibles desde el servidor                     | bucket privado sin políticas (solo service role) |

Probado contra PGlite (Postgres 17) con un stub de `auth` y `storage`.
