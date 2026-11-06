import Image from "next/image";
import { hero } from "@/content/site";
import { Button } from "@/components/ui/button";
import { ImageCard, OverlayChip } from "@/components/blocks/image-card";
import { Section } from "@/components/layout/section";

function Hero() {
  return (
    <Section
      id="top"
      background="muted"
      labelledBy="hero-title"
      padded={false}
      containerClassName="flex flex-col gap-12 pt-12 pb-12 md:pt-[72px] md:pb-16"
    >
      <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        <h1
          id="hero-title"
          className="max-w-[860px] text-display font-medium text-brand-ink"
        >
          {hero.titleStart}
          <span className="text-brand-green">{hero.titleAccent}</span>
          {hero.titleEnd}
        </h1>
        <div className="flex max-w-[340px] flex-col gap-5">
          <p className="text-body text-ink-muted">{hero.lead}</p>
          <div className="flex flex-wrap gap-2">
            <Button href={hero.primaryCta.href}>{hero.primaryCta.label}</Button>
            <Button href={hero.secondaryCta.href} variant="outline" icon={null}>
              {hero.secondaryCta.label}
            </Button>
          </div>
        </div>
      </div>

      <ImageCard
        image={hero.image}
        priority
        radius="image"
        sizes="(min-width: 1360px) 1280px, calc(100vw - 40px)"
        className="h-[clamp(320px,42vw,560px)]"
        imageClassName="object-[50%_90%]"
      >
        <div className="absolute inset-x-4 bottom-4 flex flex-wrap items-center justify-between gap-4 md:inset-x-6 md:bottom-6">
          <OverlayChip className="flex items-center">
            <Image
              src={hero.seals.src}
              alt={hero.seals.alt}
              width={hero.seals.width}
              height={hero.seals.height}
              className="h-11 w-auto"
            />
          </OverlayChip>
          <OverlayChip className="font-ui text-[0.8125rem] tracking-[0.04em]">
            <p>{hero.caption}</p>
          </OverlayChip>
        </div>
      </ImageCard>
    </Section>
  );
}

export { Hero };
