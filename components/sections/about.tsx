import { HeartHandshake, Sprout, Zap, type LucideIcon } from "lucide-react";
import { about, type FeatureIcon } from "@/content/site";
import { FeatureCard } from "@/components/blocks/feature-card";
import { ImageCard } from "@/components/blocks/image-card";
import { Section } from "@/components/layout/section";
import { SectionHeader } from "@/components/layout/section-header";

const icons: Record<FeatureIcon, LucideIcon> = {
  action: Zap,
  doers: Sprout,
  hope: HeartHandshake,
};

function About() {
  return (
    <Section id="about" labelledBy="about-title" containerClassName="flex flex-col gap-14">
      <SectionHeader
        layout="inline"
        size="statement"
        eyebrow={about.eyebrow}
        title={about.title}
        titleId="about-title"
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {about.features.map((feature) => (
          <FeatureCard
            key={feature.title}
            icon={icons[feature.icon]}
            title={feature.title}
            text={feature.text}
          />
        ))}
        <ImageCard
          image={about.image}
          sizes="(min-width: 1280px) 320px, (min-width: 640px) 50vw, 100vw"
          className="min-h-[260px]"
        />
      </div>
    </Section>
  );
}

export { About };
