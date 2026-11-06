import type { LucideIcon, LucideProps } from "lucide-react";
import { cn } from "@/lib/utils";

type IconProps = Omit<LucideProps, "ref"> & {
  icon: LucideIcon;
  /** Si el ícono transmite información, pasá un label; si no, queda decorativo. */
  label?: string;
};

/** Wrapper de lucide-react: trazo 1.5–2 y decorativo por defecto. */
function Icon({ icon: Glyph, label, strokeWidth = 1.75, className, ...props }: IconProps) {
  return (
    <Glyph
      strokeWidth={strokeWidth}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? "img" : undefined}
      className={cn("shrink-0", className)}
      {...props}
    />
  );
}

export { Icon };
