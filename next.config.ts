import type { NextConfig } from "next";

// Headers de seguridad para todo el sitio. Solo agregan headers: no cambian
// status, Content-Type ni cuerpo de ninguna respuesta (incluido /private-info/).
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  {
    key: "Permissions-Policy",
    value:
      "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=(), browsing-topics=()",
  },
];

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },

  // Las fuentes del PDF (lib/pdf/fonts) se leen del disco en runtime: incluirlas en
  // las funciones del panel, que generan el placeholder y los COAs.
  outputFileTracingIncludes: {
    "/admin/**": ["./lib/pdf/fonts/**/*"],
  },

  async redirects() {
    // URLs legales del sitio anterior (cPanel). 301 explícito, como pide el plan de migración.
    return [
      { source: "/sections/legal-1.html", destination: "/legal/terms-of-use", statusCode: 301 },
      { source: "/sections/legal-2.html", destination: "/legal/privacy", statusCode: 301 },
      { source: "/sections/legal-3.html", destination: "/legal/terms-of-sale", statusCode: 301 },
    ];
  },

  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // Evita que los COAs se indexen. No toca cómo se sirven (regla inmutable de /private-info/).
      {
        source: "/private-info/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex" }],
      },
      {
        source: "/coa/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex" }],
      },
    ];
  },
};

export default nextConfig;
