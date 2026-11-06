import type { Metadata } from "next";
import { pageMeta } from "@/content/site";
import { pageMetadata } from "@/lib/seo";
import { LegalLayout } from "@/components/legal/legal-layout";

export const metadata: Metadata = pageMetadata({
  ...pageMeta["terms-of-use"],
  path: "/legal/terms-of-use",
});

export default function Page() {
  return <LegalLayout slug="terms-of-use" />;
}
