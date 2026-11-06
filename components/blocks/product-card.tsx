import Image from "next/image";
import type { SiteImage } from "@/content/site";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

/** Imagen, badge de sabor, título, descripción y CTA. */
function ProductCard({
  image,
  badge,
  title,
  description,
  cta,
}: {
  image: SiteImage;
  badge: string;
  title: string;
  description: string;
  cta: { label: string; href: string };
}) {
  return (
    <article className="flex flex-col gap-6 rounded-card-lg border border-line bg-surface p-7">
      <div className="flex h-[300px] items-center justify-center rounded-inner bg-surface-muted">
        <Image
          src={image.src}
          alt={image.alt}
          width={image.width}
          height={image.height}
          sizes="170px"
          className="h-[270px] w-auto"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Badge>{badge}</Badge>
        <h3 className="text-h3 font-semibold text-brand-ink">{title}</h3>
        <p className="text-body-sm text-ink-muted">{description}</p>
      </div>
      <Button
        variant="outline"
        href={cta.href}
        className="self-start"
        aria-label={`${cta.label}: ${title}, ${badge}`}
      >
        {cta.label}
      </Button>
    </article>
  );
}

export { ProductCard };
