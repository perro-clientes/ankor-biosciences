import { business } from "@/content/site";
import { Button } from "@/components/ui/button";
import { NumberedCard } from "@/components/blocks/numbered-card";
import { Section } from "@/components/layout/section";
import { SectionHeader } from "@/components/layout/section-header";

function BusinessDevelopment() {
  return (
    <Section
      id="business"
      background="image"
      image={business.image}
      labelledBy="business-title"
      containerClassName="flex flex-col gap-16"
    >
      <SectionHeader
        eyebrow={business.eyebrow}
        title={business.title}
        titleId="business-title"
        aside={<p>{business.lead}</p>}
      />
      <ol className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {business.partners.map((partner, index) => (
          <NumberedCard key={partner} number={index + 1} title={partner} />
        ))}
      </ol>
      <Button href={business.cta.href} variant="inverse" className="self-start whitespace-normal">
        {business.cta.label}
      </Button>
    </Section>
  );
}

export { BusinessDevelopment };
