import * as React from "react";
import { cn } from "@/lib/utils";

type EyebrowProps = React.ComponentProps<"p"> & {
  /** Punto verde. Apagado por defecto; en la referencia solo lo usa Investors. */
  dot?: boolean;
};

/** Label de sección: Chivo 13px, mayúsculas, tracking 0.08em. Toma el color del contexto (claro/oscuro). */
function Eyebrow({ dot = false, className, children, ...props }: EyebrowProps) {
  return (
    <p
      className={cn(
        "flex items-center gap-2.5 font-ui text-eyebrow font-normal text-muted-foreground uppercase",
        className,
      )}
      {...props}
    >
      {dot && (
        <span aria-hidden="true" className="block size-2 rounded-pill bg-brand-green-light" />
      )}
      {children}
    </p>
  );
}

export { Eyebrow };
