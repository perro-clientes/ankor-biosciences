import Image from "next/image";
import Link from "next/link";
import { headerCta, headerNav, site } from "@/content/site";
import { Button } from "@/components/ui/button";
import { Container } from "./container";
import { MobileNav } from "./mobile-nav";

function SiteHeader() {
  return (
    <header className="relative z-10">
      <Container className="flex items-center justify-between gap-6 py-6">
        <Link
          href="/"
          aria-label={`${site.name}, home`}
          className="flex min-h-target items-center rounded-sm"
        >
          <Image
            src={site.logo.dark.src}
            alt=""
            width={site.logo.dark.width}
            height={site.logo.dark.height}
            priority
            className="h-[34px] w-auto"
          />
        </Link>

        <nav aria-label="Main" className="hidden lg:block">
          <ul className="grid grid-cols-4 gap-x-10">
            {headerNav.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="flex min-h-target items-center font-ui text-button tracking-[0.06em] text-brand-ink uppercase transition-colors hover:text-brand-green"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <Button href={headerCta.href} className="hidden sm:inline-flex">
            {headerCta.label}
          </Button>
          <MobileNav />
        </div>
      </Container>
    </header>
  );
}

export { SiteHeader };
