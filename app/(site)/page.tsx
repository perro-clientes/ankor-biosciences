import type { Metadata } from "next";
import { pageMeta, site } from "@/content/site";
import { pageMetadata } from "@/lib/seo";
import { JsonLd } from "@/components/blocks/json-ld";
import { About } from "@/components/sections/about";
import { AdvocatesCommunity } from "@/components/sections/advocates-community";
import { BusinessDevelopment } from "@/components/sections/business-development";
import { ContactSection } from "@/components/sections/contact-section";
import { ExportOpportunities } from "@/components/sections/export-opportunities";
import { Hero } from "@/components/sections/hero";
import { InvestorsCta } from "@/components/sections/investors-cta";
import { ProductPipeline } from "@/components/sections/product-pipeline";

export const metadata: Metadata = pageMetadata({ ...pageMeta.home, path: "/", absoluteTitle: true });

export default function Home() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          "@id": `${site.url}/#website`,
          name: site.name,
          url: site.url,
          inLanguage: "en",
          publisher: { "@id": `${site.url}/#organization` },
        }}
      />
      <Hero />
      <About />
      <ProductPipeline />
      <AdvocatesCommunity />
      <BusinessDevelopment />
      <ExportOpportunities />
      <InvestorsCta />
      <ContactSection />
    </>
  );
}
