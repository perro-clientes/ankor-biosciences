import { contactHref, products } from "@/content/site";
import { FdaDisclaimer } from "@/components/blocks/fda-disclaimer";
import { ProductCard } from "@/components/blocks/product-card";
import { Section } from "@/components/layout/section";
import { SectionHeader } from "@/components/layout/section-header";

function ProductPipeline() {
  return (
    <Section
      id="products"
      background="muted"
      labelledBy="products-title"
      containerClassName="flex flex-col gap-14"
    >
      <SectionHeader
        eyebrow={products.eyebrow}
        titleId="products-title"
        title={
          <>
            {products.titleLines[0]}
            <br />
            {products.titleLines[1]}
          </>
        }
        aside={<p>{products.lead}</p>}
      />
      <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {products.items.map((product) => (
          <li key={product.slug} className="grid">
            <ProductCard
              image={product.image}
              badge={product.flavour}
              title={product.name}
              description={product.description}
              cta={{ label: products.ctaLabel, href: contactHref("product", product.slug) }}
            />
          </li>
        ))}
      </ul>
      <FdaDisclaimer variant="short" />
    </Section>
  );
}

export { ProductPipeline };
