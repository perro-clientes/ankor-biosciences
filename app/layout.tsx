import type { Metadata } from "next";
import { Chivo, Rajdhani, Roboto } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

// Titulares: misma familia que el logotipo. No es variable: hay que listar pesos.
const rajdhani = Rajdhani({
  variable: "--font-rajdhani",
  subsets: ["latin"],
  weight: ["500", "600"],
});

// Texto de lectura (300). Incluye griego para el glifo Δ (Δ-8-THC, Δ-9-THC).
const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin", "greek"],
});

// UI, botones, labels, disclaimers (300–700). Variable.
const chivo = Chivo({
  variable: "--font-chivo",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ankor Biosciences",
  description: "Ankor Biosciences",
  icons: {
    icon: { url: "/meta/favicon.png", type: "image/png" },
    apple: "/meta/favicon.png",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${rajdhani.variable} ${roboto.variable} ${chivo.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
