import Image from "next/image";
import Link from "next/link";
import { site } from "@/content/site";

/** Logo + "Panel de COAs". */
export function AdminBrand({ href = "/admin" }: { href?: string }) {
  return (
    <Link href={href} className="flex min-h-target items-center gap-3">
      <Image
        src={site.logo.dark.src}
        alt={site.logo.dark.alt}
        width={site.logo.dark.width}
        height={site.logo.dark.height}
        priority
        className="h-6 w-auto md:h-7"
      />
      <span className="hidden border-l border-line pl-3 font-ui text-button tracking-[0.06em] text-ink-muted uppercase sm:inline">
        Panel de COAs
      </span>
    </Link>
  );
}
