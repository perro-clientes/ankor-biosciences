import type { Metadata } from "next";
import { site } from "@/content/site";

/**
 * Metadata por página: title, description, canonical y Open Graph/Twitter con
 * los mismos textos (Next no copia el title a og:title por sí solo).
 * Ojo: definir `openGraph` en una página reemplaza el del layout y se pierde la
 * imagen de app/opengraph-image.jpg, por eso se vuelve a declarar acá.
 */
export function pageMetadata({
  title,
  description,
  path,
  absoluteTitle = false,
}: {
  title: string;
  description: string;
  path: string;
  absoluteTitle?: boolean;
}): Metadata {
  const fullTitle = absoluteTitle ? title : `${title} | ${site.name}`;
  const { src, alt, width, height } = site.ogImage;
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName: site.name,
      locale: "en_US",
      url: path,
      title: fullTitle,
      description,
      images: [{ url: src, alt, width, height }],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [{ url: src, alt }],
    },
  };
}
