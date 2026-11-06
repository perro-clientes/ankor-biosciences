import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Select nativo con el estilo de Input. Preferido sobre el Select de Base UI en
 * formularios: accesible por defecto, teclado/lector nativos en mobile y
 * funciona sin JS (FormData de la Server Action).
 */
function NativeSelect({ className, children, ...props }: React.ComponentProps<"select">) {
  return (
    <div className="relative">
      <select
        data-slot="native-select"
        className={cn(
          "min-h-target w-full min-w-0 appearance-none rounded-lg border border-input bg-surface py-2 pr-11 pl-4 text-body font-normal text-brand-ink transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-ink-muted"
      />
    </div>
  );
}

export { NativeSelect };
