import * as React from "react";
import { cn } from "@/lib/utils";
import { Eyebrow } from "./eyebrow";

type SectionHeaderProps = {
  eyebrow: string;
  eyebrowDot?: boolean;
  title: React.ReactNode;
  /** id del heading, para el aria-labelledby de la sección. */
  titleId: string;
  /** h1 solo en páginas internas (por ejemplo /contact). */
  as?: "h1" | "h2";
  /** section: H2 grande · statement: H2 de frase larga. */
  size?: "section" | "statement";
  /** Texto lateral opcional (debajo del título en mobile). */
  aside?: React.ReactNode;
  /**
   * stacked: eyebrow sobre el título, aside a la derecha alineado abajo.
   * inline: eyebrow en una columna a la izquierda y título a la derecha (About).
   */
  layout?: "stacked" | "inline";
  className?: string;
  titleClassName?: string;
  asideClassName?: string;
};

function SectionHeader({
  eyebrow,
  eyebrowDot,
  title,
  titleId,
  as: Heading = "h2",
  size = "section",
  aside,
  layout = "stacked",
  className,
  titleClassName,
  asideClassName,
}: SectionHeaderProps) {
  const heading = (
    <Heading
      id={titleId}
      className={cn(
        "font-medium text-foreground",
        size === "section" ? "text-section" : "text-statement",
        titleClassName,
      )}
    >
      {title}
    </Heading>
  );

  if (layout === "inline") {
    return (
      <div className={cn("flex flex-col gap-6 md:flex-row md:items-start md:gap-10", className)}>
        <Eyebrow dot={eyebrowDot} className="md:flex-1 md:pt-3">
          {eyebrow}
        </Eyebrow>
        <div className="md:flex-3">{heading}</div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-6 md:flex-row md:flex-wrap md:items-end md:justify-between md:gap-8",
        className,
      )}
    >
      <div className="flex max-w-3xl flex-col gap-5">
        <Eyebrow dot={eyebrowDot}>{eyebrow}</Eyebrow>
        {heading}
      </div>
      {aside && (
        <div
          className={cn(
            "max-w-sm text-body text-muted-foreground md:max-w-[26rem]",
            asideClassName,
          )}
        >
          {aside}
        </div>
      )}
    </div>
  );
}

export { SectionHeader };
