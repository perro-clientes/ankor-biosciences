import { Mail } from "lucide-react";
import { advocates, contact } from "@/content/site";
import { Button } from "@/components/ui/button";
import { ImageCard } from "@/components/blocks/image-card";
import { Section } from "@/components/layout/section";
import { SectionHeader } from "@/components/layout/section-header";

function AdvocatesCommunity() {
  return (
    <Section id="advocates" labelledBy="advocates-title" containerClassName="flex flex-col gap-14">
      <SectionHeader
        eyebrow={advocates.eyebrow}
        title={advocates.title}
        titleId="advocates-title"
        titleClassName="max-w-[900px]"
      />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.25fr_1fr]">
        <ImageCard
          image={advocates.image}
          radius="card-lg"
          sizes="(min-width: 1024px) 55vw, 100vw"
          className="min-h-[460px]"
        >
          <div className="absolute inset-x-4 bottom-4 max-w-[460px] rounded-card bg-surface p-6 md:inset-x-6 md:bottom-6">
            <p className="text-body-sm text-ink-muted">{advocates.mission}</p>
          </div>
        </ImageCard>

        <div className="flex flex-col justify-between gap-8 rounded-card-lg border border-line p-6 md:p-8">
          <p className="text-body text-ink-muted">{advocates.lead}</p>
          <ul className="flex flex-col">
            {advocates.environments.map((item) => (
              <li
                key={item}
                className="border-t border-line py-4 font-heading text-item font-medium text-brand-ink last:border-b"
              >
                {item}
              </li>
            ))}
          </ul>
          <div className="flex flex-col gap-3">
            <p className="text-sm font-normal text-ink-muted">{advocates.ctaIntro}</p>
            <Button href={`mailto:${contact.email}`} icon={Mail} className="self-start normal-case">
              {contact.email}
            </Button>
          </div>
        </div>
      </div>
    </Section>
  );
}

export { AdvocatesCommunity };
