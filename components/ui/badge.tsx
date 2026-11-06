import * as React from "react";
import { cn } from "@/lib/utils";

/** Píldora surface-tint / ink-badge (sabores de producto, etiquetas). */
function Badge({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="badge"
      className={cn(
        "inline-flex items-center self-start rounded-pill bg-surface-tint px-3 py-1.5 font-ui text-caption leading-none font-bold tracking-[0.08em] text-ink-badge uppercase",
        className,
      )}
      {...props}
    />
  );
}

export { Badge };
