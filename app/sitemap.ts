import type { MetadataRoute } from "next";
import { legalPages, site } from "@/content/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const legal = Object.keys(legalPages).map((slug) => ({
    url: `${site.url}/legal/${slug}`,
    changeFrequency: "yearly" as const,
    priority: 0.3,
  }));

  return [
    { url: `${site.url}/`, changeFrequency: "monthly", priority: 1 },
    { url: `${site.url}/contact`, changeFrequency: "yearly", priority: 0.7 },
    ...legal,
  ];
}
