import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { SiteImage } from "@/content/site";
import { Container } from "./container";

type SectionProps = Omit<React.ComponentProps<"section">, "children"> & {
  /** default (blanco) · muted (surface-muted) · dark (brand-dark) · image (foto + overlay oscuro) */
  background?: "default" | "muted" | "dark" | "image";
  /** Requerida con background="image". Decorativa salvo que tenga alt. */
  image?: SiteImage;
  /** id del heading que nombra la sección (aria-labelledby). */
  labelledBy?: string;
  containerClassName?: string;
  /** false para manejar el padding vertical dentro (por ejemplo, el banner de Investors). */
  padded?: boolean;
  children: React.ReactNode;
};

function Section({
  background = "default",
  image,
  labelledBy,
  className,
  containerClassName,
  padded = true,
  children,
  ...props
}: SectionProps) {
  const isDark = background === "dark" || background === "image";

  return (
    <section
      aria-labelledby={labelledBy}
      className={cn(
        "relative",
        background === "muted" && "bg-surface-muted",
        isDark && "dark overflow-hidden bg-brand-dark text-foreground",
        className,
      )}
      {...props}
    >
      {background === "image" && image && (
        <>
          <Image
            src={image.src}
            alt={image.alt}
            fill
            sizes="100vw"
            className="object-cover opacity-55"
          />
          {/* Overlay para asegurar contraste del texto sobre la foto. */}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-linear-to-b from-brand-ink/55 to-brand-ink/88"
          />
        </>
      )}
      <Container
        className={cn("relative", padded && "py-section-sm lg:py-section", containerClassName)}
      >
        {children}
      </Container>
    </section>
  );
}

export { Section };
