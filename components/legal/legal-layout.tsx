import Link from "next/link";
import { ChevronDown, ChevronRight } from "lucide-react";
import { legalPages, site, type LegalSlug } from "@/content/site";
import { legalContent, type LegalBlock } from "@/content/legal";
import { Container } from "@/components/layout/container";
import { JsonLd } from "@/components/blocks/json-ld";

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeZone: "UTC" }).format(
    new Date(`${iso}T00:00:00Z`),
  );
}

/** Breadcrumb + H1 + índice (sticky en desktop, colapsable en mobile) + columna de lectura. */
function LegalLayout({ slug }: { slug: LegalSlug }) {
  const page = legalPages[slug];
  const blocks = legalContent[slug];
  const headings = blocks.filter((b): b is Extract<LegalBlock, { type: "h2" }> => b.type === "h2");
  const path = `/legal/${slug}`;

  return (
    <article aria-labelledby="legal-title">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: `${site.url}/` },
            { "@type": "ListItem", position: 2, name: page.title, item: `${site.url}${path}` },
          ],
        }}
      />

      <div className="bg-surface-muted">
        <Container className="flex flex-col gap-6 py-12 md:py-16">
          <nav aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-1.5 font-ui text-xs tracking-[0.06em] text-ink-muted uppercase">
              <li>
                <Link href="/" className="inline-flex min-h-8 items-center hover:text-brand-green">
                  Home
                </Link>
              </li>
              <li aria-hidden="true">
                <ChevronRight className="size-3.5" />
              </li>
              <li aria-current="page" className="text-brand-ink">
                {page.title}
              </li>
            </ol>
          </nav>
          <h1 id="legal-title" className="max-w-4xl text-section font-medium text-brand-ink">
            {page.title}
          </h1>
          {page.lastUpdated && (
            <p className="font-ui text-sm text-ink-muted">
              Last updated: <time dateTime={page.lastUpdated}>{formatDate(page.lastUpdated)}</time>
            </p>
          )}
        </Container>
      </div>

      <Container className="grid grid-cols-1 gap-10 py-12 md:py-16 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-16">
        {headings.length > 0 && (
          <aside className="lg:sticky lg:top-6 lg:self-start">
            {/* Mobile: colapsable sin JS */}
            <details className="group rounded-card border border-line lg:hidden">
              <summary className="flex min-h-target cursor-pointer list-none items-center justify-between px-5 font-ui text-button font-bold tracking-[0.06em] text-brand-ink uppercase [&::-webkit-details-marker]:hidden">
                On this page
                <ChevronDown
                  aria-hidden="true"
                  className="size-4 transition-transform group-open:rotate-180"
                />
              </summary>
              <Toc headings={headings} className="px-5 pb-4" />
            </details>
            {/* Desktop */}
            <nav aria-label="On this page" className="hidden lg:block">
              <p className="mb-3 font-ui text-caption tracking-[0.08em] text-ink-muted uppercase">
                On this page
              </p>
              <Toc headings={headings} />
            </nav>
          </aside>
        )}

        <div className="flex max-w-[70ch] flex-col gap-5 text-reading font-light text-brand-ink">
          {blocks.map((block, i) => (
            <Block key={i} block={block} />
          ))}
        </div>
      </Container>
    </article>
  );
}

function Toc({
  headings,
  className,
}: {
  headings: Extract<LegalBlock, { type: "h2" }>[];
  className?: string;
}) {
  return (
    <ol className={className}>
      {headings.map((h) => (
        <li key={h.id}>
          <a
            href={`#${h.id}`}
            className="flex min-h-9 items-center border-l-2 border-line py-1 pl-3 text-sm font-normal text-ink-muted transition-colors hover:border-brand-green hover:text-brand-green"
          >
            {h.text}
          </a>
        </li>
      ))}
    </ol>
  );
}

function Block({ block }: { block: LegalBlock }) {
  switch (block.type) {
    case "h2":
      return (
        <h2 id={block.id} className="mt-6 text-h3 font-semibold text-brand-ink first:mt-0">
          {block.text}
        </h2>
      );
    case "p":
      return <p>{block.text}</p>;
    case "ul":
      return (
        <ul className="flex list-disc flex-col gap-2 pl-6 marker:text-brand-green">
          {block.items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      );
    case "ol":
      return (
        <ol className="flex list-decimal flex-col gap-2 pl-6 marker:text-brand-green">
          {block.items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ol>
      );
  }
}

export { LegalLayout };
