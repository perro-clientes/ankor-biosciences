import type { Metadata } from "next";
import { Suspense } from "react";
import { contactPage, pageMeta, site } from "@/content/site";
import { ContactDetails } from "@/components/blocks/contact-details";
import { JsonLd } from "@/components/blocks/json-ld";
import { ContactForm, ContactFormWithParams } from "@/components/contact/contact-form";
import { Container } from "@/components/layout/container";
import { SectionHeader } from "@/components/layout/section-header";

export const metadata: Metadata = {
  title: pageMeta.contact.title,
  description: pageMeta.contact.description,
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <section aria-labelledby="contact-title">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ContactPage",
          name: `${pageMeta.contact.title} | ${site.name}`,
          description: pageMeta.contact.description,
          url: `${site.url}/contact`,
          about: { "@id": `${site.url}/#organization` },
        }}
      />
      <Container className="grid grid-cols-1 gap-12 py-section-sm lg:grid-cols-2 lg:gap-16 lg:py-section">
        <div className="flex flex-col gap-10">
          <SectionHeader
            as="h1"
            eyebrow={contactPage.eyebrow}
            title={contactPage.title}
            titleId="contact-title"
          />
          <p className="max-w-md text-body text-ink-muted">{contactPage.lead}</p>
          <ContactDetails />
        </div>
        <div className="rounded-image bg-surface-muted p-6 md:p-10">
          {/* Los ?topic= y ?product= se leen en el cliente; el fallback es el mismo formulario vacío. */}
          <Suspense fallback={<ContactForm />}>
            <ContactFormWithParams />
          </Suspense>
        </div>
      </Container>
    </section>
  );
}
