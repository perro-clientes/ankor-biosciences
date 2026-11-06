import * as React from "react";
import Image from "next/image";
import type { SiteImage } from "@/content/site";
import { cn } from "@/lib/utils";

/**
 * Imagen con next/image en un contenedor redondeado + slot de overlay
 * (card blanca, chip oscuro, etc.) posicionado por el que lo usa.
 */
function ImageCard({
  image,
  sizes,
  priority = false,
  radius = "card",
  className,
  imageClassName,
  children,
}: {
  image: SiteImage;
  sizes: string;
  priority?: boolean;
  radius?: "card" | "card-lg" | "image";
  className?: string;
  imageClassName?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden bg-brand-ink",
        radius === "card" && "rounded-card",
        radius === "card-lg" && "rounded-card-lg",
        radius === "image" && "rounded-image",
        className,
      )}
    >
      <Image
        src={image.src}
        alt={image.alt}
        fill
        sizes={sizes}
        priority={priority}
        className={cn("object-cover", imageClassName)}
      />
      {children}
    </div>
  );
}

/** Chip oscuro translúcido para overlays sobre foto. */
function OverlayChip({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("rounded-card bg-overlay-chip px-5 py-4 text-white", className)}
      {...props}
    />
  );
}

export { ImageCard, OverlayChip };
