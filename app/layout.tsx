import type { Metadata } from "next";
import { Chivo, Rajdhani, Roboto } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { contact, pageMeta, site } from "@/content/site";
import { JsonLd } from "@/components/blocks/json-ld";
import "./globals.css";

// Títulos, nombres de items, datos de contacto.
const rajdhani = Rajdhani({
  variable: "--font-rajdhani",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

// Párrafos (default del body).
const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  display: "swap",
});

// Botones, eyebrows, badges, navegación, disclaimers.
const chivo = Chivo({
  variable: "--font-chivo",
  subsets: ["latin"],
  weight: ["300", "400", "700"],
  display: "swap",
});

// Íconos, imagen OG/Twitter y su alt salen de la convención de archivos de app/
// (icon.svg, apple-icon.png, opengraph-image.jpg, twitter-image.jpg, *.alt.txt).
export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: site.name, template: `%s | ${site.name}` },
  description: pageMeta.home.description,
  applicationName: site.name,
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    siteName: site.name,
    locale: "en_US",
  },
  twitter: { card: "summary_large_image" },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${site.url}/#organization`,
  name: site.name,
  url: site.url,
  logo: `${site.url}${site.logo.dark.src}`,
  email: contact.email,
  telephone: contact.phone.e164,
  address: {
    "@type": "PostalAddress",
    streetAddress: contact.address.street,
    addressLocality: contact.address.city,
    addressRegion: contact.address.region,
    postalCode: contact.address.postalCode,
    addressCountry: contact.address.countryCode,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${rajdhani.variable} ${roboto.variable} ${chivo.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <JsonLd data={organizationJsonLd} />
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
