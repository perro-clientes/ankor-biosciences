import * as React from "react";
import Link from "next/link";
import { cva, type VariantProps } from "class-variance-authority";
import { ArrowRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Button
 * - primary: píldora verde + flecha en un círculo separado (como la referencia).
 * - outline: borde line-strong, hover surface-tint.
 * - inverse: fondo blanco, para usar sobre oscuro.
 * - ghost: sin fondo (íconos, cierre del menú).
 * Con `href` renderiza un Link (rutas internas) o un <a> (mailto:, tel:, http).
 */

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-pill ui-label transition-colors select-none disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "gap-1",
        outline:
          "gap-2 border border-line-strong bg-surface text-brand-ink hover:bg-surface-tint",
        inverse: "gap-2 bg-surface text-brand-ink hover:bg-surface-tint",
        ghost: "gap-2 text-brand-ink hover:bg-surface-tint",
      },
      size: {
        default: "min-h-target",
        lg: "min-h-12",
        icon: "size-target",
      },
    },
    compoundVariants: [
      { variant: ["outline", "inverse", "ghost"], size: "default", className: "px-5" },
      { variant: ["outline", "inverse", "ghost"], size: "lg", className: "px-6" },
    ],
    defaultVariants: { variant: "primary", size: "default" },
  },
);

const primaryPart =
  "flex items-center justify-center rounded-pill bg-primary text-primary-foreground transition-colors group-hover/button:bg-brand-ink";

type BaseProps = VariantProps<typeof buttonVariants> & {
  className?: string;
  children?: React.ReactNode;
  /** Ícono final. Por defecto: flecha. `null` para ocultarlo. */
  icon?: LucideIcon | null;
};

type ButtonAsButton = BaseProps &
  Omit<React.ComponentProps<"button">, keyof BaseProps> & { href?: undefined };
type ButtonAsLink = BaseProps &
  Omit<React.ComponentProps<"a">, keyof BaseProps> & { href: string };

export type ButtonProps = ButtonAsButton | ButtonAsLink;

function isExternal(href: string) {
  return /^(mailto:|tel:|https?:)/.test(href);
}

function Button({
  variant = "primary",
  size = "default",
  icon = ArrowRight,
  className,
  children,
  ...props
}: ButtonProps) {
  const Icon = icon;
  const classes = cn(buttonVariants({ variant, size }), className);

  const content =
    variant === "primary" ? (
      <>
        {children != null && (
          <span className={cn(primaryPart, "self-stretch px-5", size === "lg" && "px-6")}>
            {children}
          </span>
        )}
        {Icon && (
          <span
            className={cn(primaryPart, size === "lg" ? "size-12" : "size-target")}
            aria-hidden="true"
          >
            <Icon className="size-4" strokeWidth={2} />
          </span>
        )}
      </>
    ) : (
      <>
        {children}
        {Icon && <Icon className="size-3.5" strokeWidth={2} aria-hidden="true" />}
      </>
    );

  if (props.href !== undefined) {
    const { href, ...rest } = props as ButtonAsLink;
    if (isExternal(href)) {
      return (
        <a href={href} className={classes} data-slot="button" {...rest}>
          {content}
        </a>
      );
    }
    return (
      <Link href={href} className={classes} data-slot="button" {...rest}>
        {content}
      </Link>
    );
  }

  const { type = "button", ...rest } = props as ButtonAsButton;
  return (
    <button type={type} className={classes} data-slot="button" {...rest}>
      {content}
    </button>
  );
}

export { Button, buttonVariants };
