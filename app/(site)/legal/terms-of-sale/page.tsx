import type { Metadata } from "next";
import { pageMeta } from "@/content/site";
import { LegalLayout } from "@/components/legal/legal-layout";

export const metadata: Metadata = {
  title: pageMeta["terms-of-sale"].title,
  description: pageMeta["terms-of-sale"].description,
  alternates: { canonical: "/legal/terms-of-sale" },
};

export default function Page() {
  return <LegalLayout slug="terms-of-sale" />;
}
