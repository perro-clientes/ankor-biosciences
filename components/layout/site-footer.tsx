import Image from "next/image";
import Link from "next/link";
import { cacheLife } from "next/cache";
import { contact, footerNav, site } from "@/content/site";
import { ContactDetails } from "@/components/blocks/contact-details";
import { FdaDisclaimer } from "@/components/blocks/fda-disclaimer";
import { Container } from "./container";

// Con Cache Components, la fecha se cachea en vez de calcularse en cada request.
async function CopyrightYear() {
  "use cache";
  cacheLife("days");
  return <>{new Date().getFullYear()}</>;
}

const columnTitle = "font-ui text-caption tracking-[0.08em] text-on-dark-muted uppercase";

function SiteFooter() {
  return (
    <footer className="bg-brand-ink text-white">
      <Container className="flex flex-col gap-14 pt-20 pb-10">
        <div className="flex flex-col gap-12 lg:flex-row lg:justify-between">
          <div className="flex max-w-[420px] flex-col gap-6">
            <Image
              src={site.logo.light.src}
              alt={site.logo.light.alt}
              width={site.logo.light.width}
              height={site.logo.light.height}
              className="h-10 w-auto self-start"
            />
            <p className="text-body-sm text-line-strong">{site.tagline}</p>
          </div>

          <div className="grid flex-1 grid-cols-1 gap-8 sm:grid-cols-2 lg:max-w-4xl lg:grid-cols-4">
            {footerNav.map((column) => (
              <nav key={column.title} aria-label={column.title} className="flex flex-col gap-3">
                <h2 className={columnTitle}>{column.title}</h2>
                <ul className="flex flex-col">
                  {column.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="inline-flex min-h-8 items-center text-sm font-normal text-white transition-colors hover:text-brand-green-light"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
            <div className="flex flex-col gap-3">
              <h2 className={columnTitle}>Contact</h2>
              <ContactDetails variant="compact" />
            </div>
          </div>
        </div>

        <FdaDisclaimer variant="full" />

        <div className="flex flex-col justify-between gap-4 border-t border-white/16 pt-6 font-ui text-xs text-on-dark-muted sm:flex-row">
          <span>
            Copyright © <CopyrightYear /> {site.name}. All rights reserved.
          </span>
          <span>
            {contact.address.city}, {contact.address.region} · {contact.address.country}
          </span>
        </div>
      </Container>
    </footer>
  );
}

export { SiteFooter };
