import type { MetadataRoute } from "next";
import { site } from "@/content/site";

/**
 * /private-info/ NO se bloquea acá a propósito: si robots.txt lo bloquea, Google
 * no puede leer el header X-Robots-Tag: noindex (next.config.ts) y podría
 * indexar la URL igual. El noindex por header alcanza.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin"] },
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  };
}
