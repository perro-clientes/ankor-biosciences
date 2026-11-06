import Image from "next/image";
import { investors } from "@/content/site";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";
import { Eyebrow } from "@/components/layout/eyebrow";

function InvestorsCta() {
  return (
    <section id="investors" aria-labelledby="investors-title">
      <Container className="pb-section-sm lg:pb-section">
        <div className="dark relative overflow-hidden rounded-image bg-brand-green">
          <Image
            src={investors.image.src}
            alt={investors.image.alt}
            fill
            sizes="(min-width: 1360px) 1280px, 100vw"
            className="object-cover opacity-35"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-linear-to-r from-brand-ink/92 from-0% to-brand-ink/55 to-70%"
          />
          <div className="relative flex flex-col gap-10 px-6 py-14 md:px-14 md:py-[72px] lg:flex-row lg:items-end lg:justify-between">
            <div className="flex max-w-[680px] flex-col gap-5">
              <Eyebrow dot>{investors.eyebrow}</Eyebrow>
              <h2 id="investors-title" className="text-section font-medium text-white">
                {investors.title}
              </h2>
              <p className="text-body text-on-dark">{investors.text}</p>
            </div>
            <Button
              href={investors.cta.href}
              variant="inverse"
              size="lg"
              className="self-start whitespace-normal lg:self-end"
            >
              {investors.cta.label}
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}

export { InvestorsCta };
