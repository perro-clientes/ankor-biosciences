import type { Metadata } from "next";
import { pageMeta } from "@/content/site";
import { LegalLayout } from "@/components/legal/legal-layout";

export const metadata: Metadata = {
  title: pageMeta["terms-of-use"].title,
  description: pageMeta["terms-of-use"].description,
  alternates: { canonical: "/legal/terms-of-use" },
};

export default function Page() {
  return <LegalLayout slug="terms-of-use" />;
}
