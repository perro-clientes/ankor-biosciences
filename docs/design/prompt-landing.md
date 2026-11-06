# Prompt para Claude Code — Sitio Ankor Biosciences (home + contacto + legales)

> Pegá todo lo que está debajo de la línea en Claude Code. Antes, copiá `home.reference.html` a `docs/design/home.reference.html` dentro del repo.

---

## Contexto

Estamos construyendo el nuevo sitio público de **Ankor Biosciences** (ankor-bio.com) dentro de este repo Next.js. Leé primero:

- `CLAUDE.md` y `docs/spec.md`: arquitectura general del proyecto.
- `docs/design/home.reference.html`: **referencia visual aprobada** de la home. Es HTML estático con estilos inline, exportado de la herramienta de diseño. Úsalo para copiar layout, jerarquía, espaciados, textos y orden de secciones. **No copies los estilos inline**: todo se implementa con tokens de Tailwind y componentes reutilizables.
- Las imágenes ya están en `public/`. Corré `ls -R public` y mapeá cada archivo según la tabla de "Imágenes" más abajo. Si algún nombre no coincide, frená y preguntame antes de inventar.

**Regla inmutable del proyecto:** no toques nada relacionado a `/private-info/` (ruta, rewrites, middleware ni archivos). Si algún cambio pudiera afectarla, avisame primero.

El sitio está en **inglés** (`<html lang="en">`). Los textos de la referencia son el copy final, salvo donde indico lo contrario.

## Alcance

1. Design system: tokens + componentes base reutilizables.
2. Home (`/`) con las 8 secciones de la referencia.
3. Página de contacto (`/contact`) con formulario funcional (Server Action + Resend) y los mismos datos de contacto del sitio.
4. Tres páginas legales migradas del sitio actual.
5. SEO técnico completo: metadata, Open Graph, Twitter, sitemap, robots, JSON-LD, redirects de URLs viejas.
6. Accesibilidad, performance y buenas prácticas de front-end.

Trabajá en commits chicos y lógicos, en este orden: tokens → primitivos UI → layout (header/footer) → secciones → home → legales → contacto → SEO → QA. Antes de escribir código, mostrame el árbol de archivos y componentes que vas a crear.

## 1. Design tokens

Definí los tokens como CSS variables en `app/globals.css` y exponelos en Tailwind (con la sintaxis de la versión de Tailwind instalada en el repo). Ningún componente puede tener un hex suelto: solo tokens.

### Colores

| Token | Hex | Uso |
| --- | --- | --- |
| `brand-ink` | `#162311` | Texto principal, footer, fondo de imágenes (verde casi negro del logo) |
| `brand-green` | `#517A5F` | Botón primario, links, acento de titulares |
| `brand-green-light` | `#7BC196` | Acentos sin texto encima: puntos, numeración sobre oscuro, líneas |
| `brand-dark` | `#252526` | Fondo de la sección oscura |
| `surface` | `#FFFFFF` | Fondo base |
| `surface-muted` | `#F4F7F4` | Secciones alternas, cards |
| `surface-tint` | `#E8F0EA` | Badges, hover de botones outline |
| `border` | `#E2EBE4` | Bordes de cards y divisores |
| `border-strong` | `#C9D6CC` | Botones outline, disclaimer |
| `text-muted` | `#3D4A40` | Párrafos y labels sobre claro |
| `text-badge` | `#3B5A45` | Texto de badges y del disclaimer |
| `text-on-dark` | `#DDE7DF` | Párrafos sobre oscuro |
| `text-on-dark-muted` | `#9FB5A6` | Labels del footer |

**Contraste (obligatorio):** nunca texto blanco sobre `#7BC196` (da 2,1:1). Los botones con texto blanco van sobre `#517A5F` (4,9:1). Todo texto debe pasar WCAG AA.

### Tipografía

Cargá las tres con `next/font/google`, subset `latin`, `display: "swap"`, y exponelas como variables CSS:

- **Rajdhani** (500, 600, 700) → `font-heading`. Títulos H1–H3, nombres de items, datos de contacto.
- **Roboto** (300, 400, 500) → `font-body`. Párrafos. Es el default del `body`.
- **Chivo** (300, 400, 700) → `font-ui`. Botones, eyebrows/labels de sección, badges, navegación, disclaimers. Casi siempre en mayúsculas con `tracking` 0.06–0.08em.

Escala (con `clamp` para fluidez, como en la referencia):

| Rol | Tamaño | Peso | Line-height |
| --- | --- | --- | --- |
| Display (H1 hero) | `clamp(44px, 6vw, 84px)` | Rajdhani 500 | 1.02 |
| H2 de sección | `clamp(40px, 4.6vw, 64px)` | Rajdhani 500 | 1.0 |
| H2 statement | `clamp(30px, 3.4vw, 46px)` | Rajdhani 500 | 1.1–1.15 |
| H3 card | 22–26px | Rajdhani 600 | 1.2 |
| Body | 15–16px | Roboto 300 | 1.55–1.6 |
| Eyebrow | 13px, uppercase, tracking 0.08em | Chivo 400 | — |
| Botón | 12px, uppercase, tracking 0.06em | Chivo 700 | — |

### Forma y espaciado

- Radios: botones y badges `999px` (píldora); cards `16–20px`; imágenes grandes `24px`; inner image boxes `14px`.
- Contenedor: `max-width: 1360px`, padding horizontal 40px (20px en mobile).
- Padding vertical de sección: 120px desktop, 80px mobile.
- Gaps: 16px entre cards, 40–64px entre bloques de una sección.
- Sin sombras ni gradientes decorativos, salvo los overlays oscuros sobre foto que ya están en la referencia.

## 2. Componentes reutilizables

Usá shadcn/ui como base donde aplique (Button, Input, Textarea, Select, Checkbox, Label, Sheet para el menú mobile) y adaptalo a los tokens. Todos son Server Components salvo que necesiten interactividad.

**Primitivos (`components/ui/`)**
- `Button`, con variantes:
  - `primary`: píldora verde con la flecha en un círculo separado, como en la referencia.
  - `outline`: borde `border-strong`, hover `surface-tint`.
  - `inverse`: fondo blanco, para usar sobre oscuro.

  Tiene que soportar `asChild`/`href` para renderizar `Link`. Altura mínima 44px.
- `Badge`: píldora `surface-tint` / `text-badge`.
- `Icon`: wrapper para `lucide-react` (stroke 1.5–2). No uses SVGs inline sueltos.

**Layout (`components/layout/`)**
- `Container` y `Section`, con variantes de fondo `default | muted | dark | image` y `id` para anclas.
- `SectionHeader`: eyebrow + título + texto lateral opcional. En la referencia se repite en todas las secciones.
- `Eyebrow`: el label de sección. El punto verde es opcional y por defecto va apagado; solo lo usa Investors.
- `SiteHeader`:
  - Logo, 4 links (About us, Investors, Product pipeline, Advocates community) y botón "Contact us" que lleva a `/contact`.
  - En mobile, menú con `Sheet` accesible.
  - Los links son `/#about` etc., para que funcionen desde otras páginas.
- `SiteFooter`: logo blanco, columnas Explore / Business / Legal, disclaimer FDA completo y copyright con el año dinámico.
- `SkipLink` ("Skip to content").

**Bloques (`components/blocks/`)**
- `FeatureCard`: ícono + título + texto, sobre `surface-muted`.
- `ProductCard`: imagen, badge de sabor, título, descripción y CTA.
- `NumberedCard`: número + título, sobre oscuro.
- `IconListCard`: ícono en círculo + texto.
- `ImageCard`: imagen con `next/image` + slot de overlay (card blanca o chip oscuro).
- `ContactDetails`: email, teléfono con horario y dirección. Se usa en la home, en `/contact` y en el footer: **una sola fuente de datos**.
- `FdaDisclaimer`: variantes `short` (bajo productos) y `full` (footer).

**Contenido:** todo el copy y los datos van en `content/site.ts`, tipado. Incluye nav, productos, features, contacto, disclaimers y metadata por página. Las secciones solo renderizan datos; así cambiar un texto no requiere tocar componentes.

## 3. Home (`app/(site)/page.tsx`)

Componentes en `components/sections/`, en este orden, fieles a la referencia:

1. `Hero`:
   - H1 con "consistent and safe" en `brand-green`, párrafo corto y dos CTAs (Business development → `#business`, Export opportunities → `#export`).
   - Imagen grande redondeada con dos overlays: los sellos de certificación sobre chip oscuro y la frase "From Colorado Springs to each corner…".
   - Es la única imagen con `priority`.
2. `About`: eyebrow + statement H2 + grilla de 3 `FeatureCard` (action / doers / hope) + 1 card de imagen.
3. `ProductPipeline`:
   - Fondo `muted`, 3 `ProductCard` (Orange, Lemon, Peppermint; "concentrated 3.38 fl oz (100 ml)") y `FdaDisclaimer short` debajo.
   - El CTA "Request information" lleva a `/contact?topic=product&product=<slug>`.
4. `AdvocatesCommunity`:
   - A la izquierda, imagen con card blanca superpuesta.
   - A la derecha, card con borde, lista de 5 entornos y botón con mail a `community@ankor-bio.com`.
5. `BusinessDevelopment`: sección oscura con foto de fondo y overlay, 4 `NumberedCard` y CTA `inverse` que lleva a `/contact?topic=business`.
6. `ExportOpportunities`: statement H2 + bloque lateral "A–Z business line" + 3 `IconListCard`. El CTA lleva a `/contact?topic=export`.
7. `InvestorsCta`: banner redondeado con foto, overlay y CTA a `/contact?topic=investors`.
8. `ContactSection`: `ContactDetails` + imagen del edificio con chip de ubicación. Agregá un CTA a `/contact`.

## 4. Imágenes

Usá siempre `next/image`, con `sizes` correctos y `alt` en inglés. Las decorativas llevan `alt=""`. Logos y sellos van en SVG.

| Archivo original | Uso | Alt |
| --- | --- | --- |
| `anlog-dg.svg` | Logo en header | "Ankor Biosciences" |
| `anlog-wh.svg` | Logo en footer | "Ankor Biosciences" |
| `back.jpg` | Imagen del hero (`priority`) | "Hemp seedling growing in dark soil" |
| `logos.svg` | Sellos de certificación en el hero | "Certification seals, including USA Grown Hemp" (confirmar con el cliente qué sellos son) |
| `back-1.jpg` | Card de imagen en About y fondo del banner Investors | "Person walking through a hemp field at sunset" / decorativa en Investors |
| `pack-1.png` / `pack-2.png` / `pack-3.png` | Productos Orange / Lemon / Peppermint | "Full Spectrum Hemp Oil, <flavour> flavour, 100 ml box" |
| `back-2.jpg` | Imagen de Advocates community | "Health professionals attending a conference" |
| `back-3.jpg` | Fondo de Business development | decorativa (`alt=""`) |
| `side-1.jpg` | Imagen de Contact (sede) | "Citadel Terrace building, Ankor Biosciences headquarters in Colorado Springs" |

Las imágenes `back-*.jpg` ya vienen oscurecidas en el original. Igual mantené el overlay sobre las que llevan texto encima, para asegurar contraste.

## 5. Páginas legales

Migrá el contenido **textual, sin reescribirlo**, desde `legacy/sections/legal-1.html`, `legal-2.html` y `legal-3.html`. Si no existen en el repo, descargalos de `https://ankor-bio.com/sections/legal-N.html`.

| Ruta nueva | Origen | Título |
| --- | --- | --- |
| `/legal/terms-of-use` | legal-1.html | Terms of Use Agreement |
| `/legal/privacy` | legal-2.html | Privacy Policy |
| `/legal/terms-of-sale` | legal-3.html | Terms of Sale & Refund Policy |

- Un único `LegalLayout`:
  - Breadcrumb y H1.
  - Índice lateral con anclas a cada H2, sticky en desktop y colapsable en mobile.
  - Columna de lectura de 68–72 caracteres de ancho, con tipografía de lectura cómoda.
- Guardá el contenido como MDX o como TSX estructurado. Convertí los encabezados del original en H2 con `id` (slug) y conservá listas y párrafos.
- No inventes una fecha de "Last updated". Dejá un campo en `content/site.ts` para cargarla.
- En `next.config`, **redirects 301**:
  - `/sections/legal-1.html` → `/legal/terms-of-use`
  - `/sections/legal-2.html` → `/legal/privacy`
  - `/sections/legal-3.html` → `/legal/terms-of-sale`
- Señalame, sin cambiarlo, cualquier contenido raro del original. Por ejemplo, la política de privacidad tiene secciones de envíos ("Next Day Shipping", "International Orders") que parecen de otro documento.

## 6. Página de contacto (`/contact`)

**Layout:** a la izquierda, `SectionHeader` + `ContactDetails` (los mismos datos del footer y la home, desde `content/site.ts`). A la derecha, el formulario dentro de una card `surface-muted`.

**Campos:**
- Full name (requerido)
- Email (requerido)
- Organization (opcional)
- Phone (opcional)
- Topic (select, requerido): General inquiry, Product information, Business development, Export opportunities, Investor relations, Advocates community
- Message (requerido, entre 20 y 2000 caracteres)
- Checkbox de aceptación de la Privacy Policy, con link (requerido)

**Comportamiento:**
- Preseleccionar Topic (y el producto en el mensaje) desde `?topic=` y `?product=`.
- Server Action con validación Zod en el servidor. También validación en el cliente con React Hook Form, compartiendo el schema.
- Envío con **Resend** a `CONTACT_TO_EMAIL` (por defecto `community@ankor-bio.com`), con `replyTo` = el email del usuario y asunto `[ankor-bio.com] <Topic> — <Name>`. El template del email va en React Email.
- Antispam:
  - Un campo honeypot oculto.
  - Rechazar envíos hechos menos de 3 segundos después de cargar el formulario.
  - Dejá preparado el lugar para sumar Cloudflare Turnstile.
- Estados de pending (botón deshabilitado con spinner), éxito (mensaje inline con `aria-live="polite"` y formulario reseteado) y error (mensaje general + errores por campo).
- Accesibilidad: `Label` visible en cada campo, `aria-invalid` y `aria-describedby` en los errores, foco al primer campo con error.
- Variables nuevas en `.env.example`: `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL`.

## 7. SEO

Usá la Metadata API del App Router.

- En el layout raíz:
  - `metadataBase: new URL("https://ankor-bio.com")`
  - `title: { default, template: "%s | Ankor Biosciences" }`
  - `description`, `applicationName`, `alternates.canonical` por página, `robots`.
  - `openGraph`: `type: "website"`, `siteName`, `locale: "en_US"`.
  - `twitter`: `card: "summary_large_image"`.
- **Open Graph:** usá la convención de archivos de Next. Voy a crear la imagen OG de 1200×630 px y la voy a dejar en `app/opengraph-image.png` y `app/twitter-image.png`. Dejá el alt en `opengraph-image.alt.txt`. Si la imagen todavía no existe, que el build no falle.
- **Favicon:** `app/icon.svg` con el hexágono del logo (tomalo de `anlog-dg.svg`) y `app/apple-icon.png` de 180 px.
- `app/sitemap.ts` con `/`, `/contact` y las 3 legales. `app/robots.ts` permite todo salvo `/admin`, apunta al sitemap y bloquea `/private-info/`.
- Header `X-Robots-Tag: noindex` para `/private-info/:path*` en `next.config`. No afecta a los QR, solo evita que Google indexe los COAs. **No toques cómo se sirven.**
- **JSON-LD** (componente `JsonLd`):
  - `Organization` en el layout: name, url, logo, email, telephone, address `PostalAddress` (685 Citadel Drive East, Colorado Springs, CO 80909, US).
  - `WebSite` en la home.
  - `ContactPage` en `/contact`.
  - `BreadcrumbList` en las legales.
  - No uses schema de `Product` con claims de salud.
- Un solo H1 por página y jerarquía de headings correcta.

**Metadata propuesta** (ajustá si algo pasa de 60 caracteres en el título o 160 en la descripción):

| Página | Title | Description |
| --- | --- | --- |
| `/` | Ankor Biosciences \| Full Spectrum Hemp Oil | Helping to shape the conditions for consistent and safe hemp-derived products globally. Full spectrum hemp oil, business development and export from Colorado Springs. |
| `/contact` | Contact | Contact Ankor Biosciences for product information, business development, export opportunities and investor relations. Colorado Springs, CO. |
| `/legal/terms-of-use` | Terms of Use | Terms and conditions governing your use of the Ankor Biosciences website. |
| `/legal/privacy` | Privacy Policy | How Ankor Biosciences collects, uses and protects your personal information. |
| `/legal/terms-of-sale` | Terms of Sale & Refund Policy | Ankor Biosciences terms of sale, refunds, shipping damage and international orders. |

## 8. Buenas prácticas de front-end

- **Server Components por defecto.** `"use client"` solo en el menú mobile y el formulario.
- TypeScript estricto. ESLint y Prettier pasan sin warnings.
- **Accesibilidad:**
  - Landmarks semánticos (`header`, `nav`, `main`, `footer`, `section` con `aria-labelledby`).
  - Skip link y `focus-visible` visible en todos los interactivos.
  - Targets de 44 px como mínimo y navegación completa por teclado.
  - Respetar `prefers-reduced-motion`.
- **Responsive:** mobile-first. Probalo en 360, 768, 1024, 1440 y 1920 px. En mobile, las grillas pasan a una columna y el texto lateral de los `SectionHeader` va debajo del título.
- **Performance:**
  - Sin librerías de animación.
  - Fuentes con `next/font`, imágenes con `next/image` y `sizes`.
  - Objetivo de Lighthouse ≥ 95 en Performance, Accessibility, Best Practices y SEO, en mobile y desktop.
  - Sin layout shift (CLS ≈ 0).
- `scroll-behavior: smooth` y `scroll-margin-top` en las secciones con ancla.
- **Headers de seguridad** en `next.config`: `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` restrictiva y `X-Frame-Options: DENY`.
- `not-found.tsx` con el mismo layout y un link a la home.

## 9. Criterios de aceptación

- [ ] La home coincide visualmente con `docs/design/home.reference.html` en 1440 px y se ve bien en 360 px.
- [ ] Ningún componente tiene colores hex o fuentes hardcodeadas: todo sale de tokens.
- [ ] Copy y datos de contacto centralizados en `content/site.ts`. El footer, la home y `/contact` usan la misma fuente.
- [ ] `/contact` envía el email por Resend; la validación funciona en cliente y servidor; los parámetros `?topic=` preseleccionan el tema.
- [ ] Las 3 legales tienen el texto original completo, con índice. Los redirects 301 desde `/sections/legal-*.html` funcionan.
- [ ] `/sitemap.xml`, `/robots.txt`, metadata, OG/Twitter y JSON-LD validan sin errores en Rich Results Test y en el validador de Schema.org.
- [ ] Lighthouse ≥ 95 en las 4 categorías.
- [ ] `pnpm build` y `pnpm lint` pasan. `/private-info/` sigue intacta (`pnpm verify:urls` en verde, si ya existe).

Al terminar, dame un resumen de lo creado, las decisiones que tomaste, lo que quedó pendiente (por ejemplo, la imagen OG o Turnstile) y cualquier contenido raro que hayas encontrado en los legales.
