import type { Metadata } from "next";
import { pageMeta } from "@/content/site";
import { pageMetadata } from "@/lib/seo";
import { LegalLayout } from "@/components/legal/legal-layout";

export const metadata: Metadata = pageMetadata({ ...pageMeta["privacy"], path: "/legal/privacy" });

export default function Page() {
  return <LegalLayout slug="privacy" />;
}
