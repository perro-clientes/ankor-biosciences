import { About } from "@/components/sections/about";
import { AdvocatesCommunity } from "@/components/sections/advocates-community";
import { BusinessDevelopment } from "@/components/sections/business-development";
import { ContactSection } from "@/components/sections/contact-section";
import { ExportOpportunities } from "@/components/sections/export-opportunities";
import { Hero } from "@/components/sections/hero";
import { InvestorsCta } from "@/components/sections/investors-cta";
import { ProductPipeline } from "@/components/sections/product-pipeline";

export default function Home() {
  return (
    <>
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
