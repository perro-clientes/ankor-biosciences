import { MapPin } from "lucide-react";
import { contact, contactSection } from "@/content/site";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { ContactDetails } from "@/components/blocks/contact-details";
import { ImageCard } from "@/components/blocks/image-card";
import { Section } from "@/components/layout/section";
import { SectionHeader } from "@/components/layout/section-header";

function ContactSection() {
  return (
    <Section
      id="contact"
      background="muted"
      labelledBy="contact-title"
      containerClassName="grid grid-cols-1 gap-4 lg:grid-cols-2"
    >
      <div className="flex flex-col gap-10 lg:pr-6">
        <SectionHeader
          eyebrow={contactSection.eyebrow}
          title={contactSection.title}
          titleId="contact-title"
        />
        <ContactDetails />
        <Button href={contactSection.cta.href} className="self-start">
          {contactSection.cta.label}
        </Button>
      </div>

      <ImageCard
        image={contactSection.image}
        radius="image"
        sizes="(min-width: 1024px) 50vw, 100vw"
        className="min-h-[360px] lg:min-h-[520px]"
      >
        <div className="absolute bottom-4 left-4 flex max-w-[320px] items-center gap-3.5 rounded-card bg-surface px-5 py-4 md:bottom-6 md:left-6">
          <span className="flex size-10 flex-none items-center justify-center rounded-pill bg-brand-green">
            <Icon icon={MapPin} className="size-[18px] text-white" />
          </span>
          <span className="flex flex-col gap-0.5">
            <span className="font-heading text-lg font-semibold text-brand-ink">
              {contact.address.building}
            </span>
            <span className="text-[0.8125rem] font-normal text-ink-muted">
              {contact.address.city}, {contact.address.region}
            </span>
          </span>
        </div>
      </ImageCard>
    </Section>
  );
}

export { ContactSection };
