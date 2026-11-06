import type { LegalSlug } from "@/content/site";
import type { LegalBlock } from "./types";
import { blocks as privacy } from "./privacy";
import { blocks as termsOfSale } from "./terms-of-sale";
import { blocks as termsOfUse } from "./terms-of-use";

export const legalContent: Record<LegalSlug, LegalBlock[]> = {
  "terms-of-use": termsOfUse,
  privacy,
  "terms-of-sale": termsOfSale,
};

export type { LegalBlock };
