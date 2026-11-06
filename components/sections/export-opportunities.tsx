import { FileCheck2, Globe, RefreshCw, type LucideIcon } from "lucide-react";
import { exportOpportunities as content, type ExportIcon } from "@/content/site";
import { Button } from "@/components/ui/button";
import { IconListCard } from "@/components/blocks/icon-list-card";
import { Section } from "@/components/layout/section";
import { Eyebrow } from "@/components/layout/eyebrow";

const icons: Record<ExportIcon, LucideIcon> = {
  documents: FileCheck2,
  updates: RefreshCw,
  global: Globe,
};

function ExportOpportunities() {
  return (
    <Section id="export" labelledBy="export-title" containerClassName="flex flex-col gap-12">
      <div className="flex flex-col gap-10 lg:flex-row lg:justify-between">
        <div className="flex flex-col gap-5 lg:flex-2">
          <Eyebrow>{content.eyebrow}</Eyebrow>
          <h2 id="export-title" className="text-statement font-medium text-brand-ink">
            {content.title}
          </h2>
        </div>
        <div className="flex max-w-[400px] flex-col gap-4 lg:flex-1 lg:pt-9">
          <h3 className="text-h3-sm font-semibold text-brand-ink">{content.asideTitle}</h3>
          <p className="text-body-sm text-ink-muted">{content.asideText}</p>
          <Button href={content.cta.href} variant="outline" className="self-start">
            {content.cta.label}
          </Button>
        </div>
      </div>
      <hr className="border-line" />
      <ul className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {content.items.map((item) => (
          <IconListCard key={item.text} icon={icons[item.icon]} text={item.text} />
        ))}
      </ul>
    </Section>
  );
}

export { ExportOpportunities };
