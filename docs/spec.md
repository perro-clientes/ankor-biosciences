# Ankor Bio — Migración del sitio + Plataforma de COAs

Nov 5, 2026 · @Fede

## Resumen

Migramos ankor-bio.com de cPanel a un único proyecto Next.js en Vercel, con el layout de Medlume y la marca de Ankor, y sumamos una plataforma para que Ankor cree lotes, QRs y COAs sin depender de PERRO.

**Regla inmutable:** toda URL bajo `/private-info/` que exista hoy debe responder igual que hoy, para siempre. Esas URLs están impresas en packaging como QR. Ningún cambio de este proyecto puede romper una.

El proyecto tiene dos fases:

1. **Migración (Fase 1):** sitio nuevo con Medlume + los 12 PDFs actuales servidos en las mismas URLs, verificados archivo por archivo antes de cambiar el DNS.
2. **Plataforma de COAs (Fase 2):** panel en `/admin` donde un responsable de Ankor crea un lote, descarga su QR, carga los datos del análisis en un formulario y publica el PDF. La URL del QR nunca cambia; cambia la versión publicada detrás.

El cambio de fondo: los PDFs dejan de ser archivos sueltos en un servidor. La URL pasa a ser un identificador fijo que apunta a la versión publicada de un documento en Supabase.

## Estado actual

El sitio es HTML estático subido a mano en cPanel, sin repositorio. Es una landing de una sola página con anclas (Product Pipeline, Investors, Advocates Community, Business Development, Export Opportunities, Contact), tres páginas legales en `/sections/legal-1.html` a `legal-3.html`, y assets en `/img/` y `/video/`.

Hoy hay 12 PDFs en `/private-info/`. Ninguna página del sitio los enlaza: solo se llega por QR.

| Archivo | Tamaño | Última modificación | Nota |
| --- | --- | --- | --- |
| AnkorBiosciences-COA-LoteXI-PDFforQrCode.pdf | 73 KB | 2026-11-04 | Placeholder vacío, QR ya generado |
| AnkorBiosciences-COA-LoteX-PDFforQrCode.pdf | 402 KB | 2026-06-22 | COA completo, lote LE260008 |
| AnkorBiosciences-COA-LoteIX-PDFforQrCode.pdf | 870 KB | 2024-10-28 |  |
| AnkorBiosciences-COA-LoteVIII-PDFforQrCode.pdf | 947 KB | 2024-02-16 |  |
| AnkorBiosciences-COA-LoteVII-PDFforQrCode.pdf | 1.022 KB | 2023-02-01 |  |
| AnkorBiosciences-COA-LoteVI-PDFforQrCode.pdf | 660 KB | 2022-09-21 |  |
| AnkorBiosciences-COA-LoteV-PDFforQrCode.pdf | 186 KB | 2021-11-19 |  |
| AnkorBiosciences-COA2020-LoteIV-PDFforQrCode.pdf | 2,11 MB | 2021-01-07 | Esquema de nombre 2020 |
| AnkorBiosciences-COA2020-LotePrueba-PDFforQrCode.pdf | 78 KB | 2020-12-14 | Prueba: confirmar si tiene QR impreso |
| AnkorBiosciences-COA2020-V2-PDFforQrCode.pdf | 136 KB | 2020-08-19 |  |
| AnkorBiosciences-COA2020-PDFforQrCode.pdf | 750 KB | 2020-05-08 |  |
| AnkorBiosciences-COA-PDFforQrCode.pdf | 181 KB | 2019-08-05 | El más antiguo |

Lo que tenemos que tener en cuenta:

- **Hay tres esquemas de nombre** (`COA-`, `COA2020-`, `COA-Lote<romano>-`). La plataforma no puede asumir un patrón: cada documento guarda su nombre de archivo exacto como dato.
- **Las rutas distinguen mayúsculas.** cPanel corre sobre Apache, que es case-sensitive. Respetamos el nombre byte por byte; si algún QR quedó con otra capitalización, solo lo sabremos escaneando packaging real.
- **Revisar el `.htaccess`** del cPanel antes de migrar: puede haber redirects o reglas que hoy hacen funcionar algún QR.
- **Error en el COA del Lote X:** dos filas aparecen como "-THC". Casi seguro son Δ-8-THC y Δ-9-THC y la fuente no tenía el carácter Δ. La plantilla nueva usa una fuente con ese glifo.

## Arquitectura y stack

Un solo proyecto Next.js sirve el sitio público, el panel y los PDFs. Supabase guarda los documentos, sus versiones y los archivos.

&#91;embedded content: arquitectura · un proyecto Next.js, Supabase detrás\]

El QR llega a `/private-info/[file]`, que busca en Postgres la versión publicada y devuelve ese PDF desde Storage. Publicar cambia qué versión se sirve, nunca la URL.

| Capa | Herramienta | Cuenta |
| --- | --- | --- |
| DNS | Cloudflare | Cliente |
| Código | GitHub (org PERRO, repo `ankor-bio`) | PERRO, con acceso del cliente |
| Runtime | Vercel | Cliente |
| Base de datos, auth, archivos | Supabase | Cliente |
| Emails | Resend | Cliente |
| UI | Next.js (App Router), Tailwind, shadcn/ui | — |
| PDF y QR | `@react-pdf/renderer`, `qrcode` | — |

Sigue el blueprint de infra de PERRO: lo crítico vive en cuentas del cliente y PERRO administra sin ser dueño. Acá es especialmente importante, porque las URLs impresas dependen del dominio y del runtime.

## Fase 1: migración

La Fase 1 termina cuando ankor-bio.com corre en Vercel con el sitio nuevo y los 12 PDFs responden en sus URLs actuales con el mismo contenido, verificado por hash.

### 1.1 Rescate del sitio actual

1. Descargar todo el `public_html` del cPanel (incluidos `.htaccess` y archivos ocultos) y subirlo a un repo `ankor-legacy` como snapshot de solo lectura.
2. Generar `inventory.json` con cada PDF de `/private-info/`: nombre exacto, tamaño y SHA-256.
3. Escanear con el celular un QR impreso de cada lote que tenga packaging disponible y anotar la URL exacta: protocolo, `www` o no, mayúsculas.

### 1.2 Sitio nuevo con el design system de Medlume

Medlume aporta la estructura: layout, escala tipográfica, espaciado, radios y patrones de sección. La marca es la de Ankor: colores y tipografías salen del sitio actual (`/css/main.css`). El sitio sigue siendo una landing con anclas más las tres páginas legales, en Next.js + Tailwind + shadcn.

| Token | Valor | Origen |
| --- | --- | --- |
| Titulares | Rajdhani 500–600 (misma familia que el logotipo) | Ankor |
| Texto de lectura | Roboto 300 (hoy 200; lo subimos por legibilidad) | Ankor |
| UI, botones, labels, disclaimers | Chivo 300–700 | Ankor |
| Verde claro | `#7BC196`: acentos, líneas, hover, íconos | Ankor |
| Verde oscuro | `#517A5F`: botones primarios, footer, disclaimers | Ankor |
| Fondo oscuro | `#252526`: sección de video y bloques invertidos | Ankor |
| Fondo claro y texto | `#FFFFFF` y `#000000` (proponemos `#252526` para texto) | Ankor |
| Escala de títulos (desktop) | H1 72 · H2 64 · H3 48 · H4 28 · H5 24 · H6 18 px | Medlume |
| Label de sección | 14 px, mayúsculas, con punto (caption-dot), en Chivo 700 | Medlume |
| Radios | Botones y chips en píldora (999 px), imágenes 12 px | Medlume |
| Espaciado | Escala 4–140 px; padding de sección 120 px | Medlume |

**Contraste:** el sitio actual pone texto blanco sobre `#7BC196`, y esa combinación da 2,1:1, por debajo del mínimo de 4,5:1. Los botones con texto blanco van en `#517A5F` (4,9:1), y el verde claro queda para acentos sin texto encima.

Los tokens van como CSS variables en `globals.css` y se mapean en la config de Tailwind, así los componentes de shadcn heredan el sistema sin tocarlos uno por uno. Rajdhani, Roboto y Chivo están en Google Fonts y se cargan con `next/font/google`, que las sirve desde el propio dominio.

Secciones de Medlume que encajan con el contenido de Ankor:

| Sección de Ankor | Patrón de Medlume |
| --- | --- |
| Intro / About + video | `hero` |
| Product Pipeline (3 aceites) | `home-packages` (cards) |
| Advocates Community | `speciality` |
| Business Development / Export | `process` o `records` |
| For Investors | `cta` |
| Contact Us | `home-location` |
| Footer con disclaimer FDA | `footer` |

### 1.3 Migración de los PDFs

1. Script `import-legacy.ts`: sube cada PDF de `inventory.json` a Supabase Storage y crea su registro en `documents` con `kind = legacy`, su `file_name` exacto y el PDF como versión 1 publicada.
2. La ruta `/private-info/[file]` ya sirve desde Supabase desde el primer deploy.
3. Script `verify-urls.ts`: recorre `inventory.json`, pide cada URL al preview de Vercel y compara status 200, `Content-Type: application/pdf` y SHA-256. Si un archivo falla, no se cambia el DNS.
4. Rutas a conservar además de los PDFs: `/sections/legal-1.html` a `legal-3.html` (301 a las rutas nuevas), `/img/*` y `/video/*` si alguna se compartía afuera.

### 1.4 Cambio de DNS

1. Dominio en Cloudflare, en la cuenta del cliente. Bajar el TTL a 5 minutos 48 horas antes.
2. Apuntar a Vercel. Configurar `ankor-bio.com` y `www.ankor-bio.com`, con redirect del que no sea el principal y HTTP a HTTPS.
3. Correr `verify-urls.ts` contra producción y escanear tres QRs físicos.
4. Mantener el cPanel activo 30 días como plan de vuelta atrás.

## Fase 2: plataforma de COAs

Un responsable de Ankor hace en `/admin`, sin PERRO, lo que hoy son cinco pasos manuales: crear el lote, bajar el QR, cargar los datos y publicar. Hay un solo tipo de documento: el COA.

### 2.1 Flujo

1. **Crear lote.** El sistema propone el siguiente nombre (`AnkorBiosciences-COA-LoteXII-PDFforQrCode.pdf`), editable antes de confirmar. Una vez creado, el nombre queda bloqueado para siempre. Estado: `pendiente`; la URL ya responde con el PDF placeholder (logo + marca de agua + disclaimer).
2. **Descargar QR.** SVG para imprenta y PNG de 2048 px, con corrección de errores nivel Q y zona de silencio de 4 módulos. El QR codifica la URL `https://` final.
3. **Cargar datos.** Formulario con vista previa del PDF en vivo. Se puede guardar como borrador sin publicar.
4. **Publicar.** Se genera el PDF, se guarda como versión nueva y pasa a ser la que sirve la URL. Queda registrado quién y cuándo.
5. **Corregir.** Editar y volver a publicar crea otra versión. Cualquier versión anterior se puede volver a publicar en un clic.

Como plan B, en cualquier lote se puede subir un PDF hecho a mano en lugar de usar la plantilla.

### 2.2 Plantilla del COA

No hay editor drag & drop libre: el COA tiene que verse siempre igual. Es una plantilla fija con campos, armada a partir del COA del Lote X.

| Bloque del PDF | Campos | Cómo se carga |
| --- | --- | --- |
| Encabezado | Lot Number, Oil Batch Sample Number, Date Received, Expiration Date + nota | Inputs y date pickers |
| Cannabinoid Overview | Total THC, Total CBD, Total Cannabinoids, Sum of Cannabinoids (mg/pkg) | Inputs numéricos |
| Batch Result | Resultado general + Potency, Solvents, Metals, Microbial, Mycotoxins, Pesticides | Selects (Pass / Fail / Tested / N/A), color automático |
| Encabezado del ensayo | Código y fecha/hora (ej. POT-INST-005, Mar 19 2026 14:37 PDT) | Input + fecha/hora |
| Tabla de analitos | Analyte, mg/pkg, %, mg/ml, LOD/LOQ, Pass/Fail | Tabla editable, filas dinámicas, pegado desde Excel/CSV |
| Notas al pie | Fórmulas de totales, métodos, condiciones | Texto de la plantilla; solo admin lo edita |
| Pie de cada página | Unit Batch y Exp. Date | Se completan solos desde el encabezado |

Detalles de la tabla de analitos:

- **Pegado desde Excel:** el usuario copia el rango de la planilla del laboratorio y lo pega; las columnas se mapean por orden.
- **Lista de analitos precargada** (CBC, CBD, CBDA, CBDV, CBG, CBGA, CBL, CBN, CBT, Δ-8-THC, Δ-9-THC, THCA, THCV y totales), editable.
- **Valores "ND" y vacíos** se respetan tal cual; no se convierten a 0.
- **Varias páginas:** el encabezado de la tabla, la marca de agua y el pie se repiten en cada página.

### 2.3 Generación del PDF

- `@react-pdf/renderer` en una Route Handler de Node en Vercel. No usa Chromium, así que entra cómodo en los límites de las funciones.
- Fuentes embebidas: Rajdhani y Chivo de la marca para títulos y etiquetas, y Roboto para la tabla de analitos, porque tiene el carácter Δ.
- Logo y marca de agua en SVG, para que el PDF pese poco y se imprima nítido.
- La misma plantilla genera la vista previa en el panel y el PDF final, para que lo que se ve sea lo que se publica.
- Validación con Zod antes de publicar: campos obligatorios, fechas coherentes (vencimiento posterior a recepción), números válidos.

### 2.4 Cómo se sirve la URL

`/private-info/[file]` busca el documento por `file_name`, toma la versión publicada y devuelve el PDF desde Storage con:

- `Content-Type: application/pdf` y `Content-Disposition: inline`.
- Caché en la CDN de Vercel con un tag por documento; al publicar se llama a `revalidateTag` y la versión nueva sale en segundos.
- Si el nombre no existe, 404. Nunca listado de directorio.
- La respuesta es el PDF, no un redirect: la URL que ve el usuario no cambia.

### 2.5 Idea para más adelante

Los QR nuevos podrían apuntar a una página como `/coa/LE260008` con los datos legibles en el celular y un botón de descarga. Se lee mucho mejor que un PDF en móvil. Los QR existentes siguen igual. También se puede sumar que el usuario suba el PDF del laboratorio y la IA pre-complete el formulario.

## Modelo de datos y seguridad

Cuatro tablas en Supabase cubren todo. `file_name` es la clave que nunca cambia: es lo que está impreso en el QR.

| Tabla | Campos principales | Para qué |
| --- | --- | --- |
| `documents` | `id`, `file_name` (único, inmutable), `label` (ej. "Lote XII"), `kind` (`legacy` / `template` / `upload`), `status` (`pendiente` / `borrador` / `publicado`), `published_version_id`, `created_by`, `created_at` | Un registro por URL de QR |
| `document_versions` | `id`, `document_id`, `version` (1, 2, 3…), `data` (jsonb con los campos del COA), `template_version`, `pdf_path` (Storage), `sha256`, `published_at`, `published_by` | Historial completo; nunca se borra |
| `templates` | `id`, `version`, `footnotes`, `analytes_default`, `active` | Textos fijos y lista de analitos editables por admin |
| `audit_log` | `actor`, `action`, `document_id`, `version_id`, `at` | Quién hizo qué y cuándo |

**Storage:** bucket privado `coa-pdfs`, con rutas `documents/<document_id>/v<version>.pdf`. Solo la Route Handler, con la service role key, lee de ahí. Nadie recibe una URL directa del bucket.

**Roles:**

| Rol | Quién | Puede |
| --- | --- | --- |
| `admin` | PERRO | Todo, incluidos plantilla, usuarios y rollback |
| `editor` | Responsable de Ankor | Crear lotes, cargar datos, publicar, descargar QR, volver a una versión anterior |

**Reglas:**

- Supabase Auth con magic link enviado por Resend. Sin contraseñas. Registro cerrado: solo entra quien un admin invitó.
- RLS en todas las tablas: solo usuarios autenticados con rol leen y escriben; la ruta pública no usa la sesión del usuario.
- Un trigger impide cambiar `file_name` una vez creado el documento, y otro impide borrar versiones publicadas.
- Email por Resend a los admins cada vez que se publica una versión, con link al PDF.
- Backups diarios de Supabase (plan Pro) y 2FA en todas las cuentas, como pide el blueprint de infra de PERRO.

## Plan de trabajo con Claude Code

El orden pone primero lo que no se puede romper: las URLs de los QR quedan resueltas y verificadas antes de construir el panel.

### `CLAUDE.md` inicial

```markdown
# Ankor Bio — sitio + plataforma de COAs

## Regla inmutable
Toda URL en inventory.json debe responder 200, application/pdf y el mismo SHA-256.
No cambiar, renombrar ni mover nada bajo /private-info/. Correr `pnpm verify:urls` antes de cada merge a main.

## Stack
Next.js (App Router) · TypeScript · Tailwind · shadcn/ui · Supabase (Auth, Postgres, Storage) · Resend · Vercel · @react-pdf/renderer · qrcode · Zod

## Estructura
- app/(site) — sitio público con design system Medlume
- app/admin — panel (protegido)
- app/private-info/[file]/route.ts — sirve PDFs, no tocar sin tests
- lib/pdf — plantilla COA (misma para preview y PDF final)
- scripts/ — import-legacy.ts, verify-urls.ts
- supabase/migrations — esquema y RLS

## Convenciones
- file_name es inmutable y case-sensitive
- Nunca borrar document_versions
- Tokens de diseño solo desde globals.css, sin hex sueltos en componentes
```

### Orden de tareas

| # | Tarea | Listo cuando |
| --- | --- | --- |
| 1 | Repo, proyecto Vercel y Supabase en cuentas del cliente; `CLAUDE.md` | Deploy vacío en preview |
| 2 | Snapshot del cPanel en `ankor-legacy` + `inventory.json` | 12 PDFs con hash |
| 3 | Migraciones de Supabase: tablas, RLS, triggers, bucket | Tests de RLS pasan |
| 4 | `import-legacy.ts` + ruta `/private-info/[file]` | `verify-urls.ts` da 12/12 en preview |
| 5 | Tokens de Medlume en Tailwind + componentes base de shadcn | Página de muestra con tipografía, colores y botones |
| 6 | Sitio público: secciones de Ankor + páginas legales + redirects | Revisión de diseño aprobada |
| 7 | Cambio de DNS | `verify-urls.ts` 12/12 en producción + 3 QR físicos escaneados |
| 8 | Plantilla COA en react-pdf a partir del diseño en Figma | El COA del Lote X regenerado coincide visualmente con el original |
| 9 | Auth con magic link + invitaciones | Login de un editor de prueba |
| 10 | Panel: lista de lotes, crear lote, QR | Lote de prueba con QR que abre el placeholder |
| 11 | Formulario del COA, pegado desde Excel, vista previa, publicar, versiones | Publicar y volver atrás sin cambiar la URL |
| 12 | Emails de Resend + audit log | Admin recibe el mail al publicar |
| 13 | Capacitación al responsable de Ankor | Carga sola el Lote XI real |

Conviene dar cada tarea a Claude Code por separado, con su criterio de "listo cuando" como objetivo, y revisar el PR antes de la siguiente. La tarea 4 necesita tests propios porque es la única que, si falla, rompe packaging ya impreso.

El Lote XI es el primer caso real: hoy tiene el placeholder publicado y su QR ya existe. Cuando Ankor mande los datos, se cargan en la plataforma en vez de armar el PDF a mano.

## Riesgos y preguntas abiertas

El riesgo principal es romper un QR impreso. Todo lo demás se arregla con un deploy.

| Riesgo | Mitigación |
| --- | --- |
| Un QR impreso apunta a una variante de URL que no conocemos (http, www, mayúsculas) | Escanear packaging real de cada lote; servir todas las variantes del dominio; comparar contra los logs de acceso del cPanel |
| Un PDF llega distinto después de migrar | `verify-urls.ts` con SHA-256 como condición para cambiar el DNS |
| La CDN sigue sirviendo una versión vieja después de publicar | `revalidateTag` por documento al publicar + prueba en la tarea 11 |
| Se publica un COA con un error de carga | Vista previa obligatoria, validación con Zod, rollback en un clic, mail a admins |
| Las cuentas quedan a nombre de PERRO | Dominio, Vercel, Supabase y Resend en cuentas del cliente desde el día 1, PERRO como admin |

**Preguntas abiertas:**

- [ ] ¿Qué URL exacta tienen los QR impresos de cada lote? Necesitamos fotos o escaneos del packaging.
- [ ] ¿El "LotePrueba" de 2020 tiene un QR impreso o se puede dejar de servir? Recomendación: servirlo igual.
- [ ] ¿Ankor aprueba los botones en verde oscuro \`#517A5F\`? El verde claro con texto blanco no pasa contraste.
- [ ] ¿El contenido del sitio se mantiene o Ankor quiere actualizar textos e imágenes en la migración?
- [ ] ¿Quién es el responsable de Ankor que va a cargar los COAs, y con qué email?
- [ ] ¿En qué formato manda el laboratorio los resultados (Excel, PDF, mail)? Define cómo diseñar el pegado de datos.
- [ ] ¿Tenemos la licencia de Medlume para usar su diseño fuera de Webflow?

**Próximos pasos:** bajar el `public_html` completo del cPanel, pedir fotos de los QR impresos y crear las cuentas del cliente.
