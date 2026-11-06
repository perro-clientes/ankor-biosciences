import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";
import { Eyebrow } from "@/components/layout/eyebrow";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { SkipLink } from "@/components/layout/skip-link";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false },
};

// Se renderiza fuera del grupo (site), así que repite su layout.
export default function NotFound() {
  return (
    <>
      <SkipLink />
      <SiteHeader />
      <main id="main" tabIndex={-1} className="flex-1 bg-surface-muted outline-none">
        <Container className="flex flex-col items-start gap-6 py-section-sm lg:py-section">
          <Eyebrow>Error 404</Eyebrow>
          <h1 className="max-w-3xl text-section font-medium text-brand-ink">
            We couldn’t find this page.
          </h1>
          <p className="max-w-md text-body text-ink-muted">
            The link may be broken or the page may have moved.
          </p>
          <Button href="/">Back to home</Button>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
