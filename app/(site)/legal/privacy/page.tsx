import type { Metadata } from "next";
import { pageMeta } from "@/content/site";
import { LegalLayout } from "@/components/legal/legal-layout";

export const metadata: Metadata = {
  title: pageMeta["privacy"].title,
  description: pageMeta["privacy"].description,
  alternates: { canonical: "/legal/privacy" },
};

export default function Page() {
  return <LegalLayout slug="privacy" />;
}
