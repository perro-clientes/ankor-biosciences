import { disclaimers } from "@/content/site";
import { cn } from "@/lib/utils";

/** short: recuadro bajo los productos · full: texto completo del footer (sobre oscuro). */
function FdaDisclaimer({
  variant = "short",
  className,
}: {
  variant?: "short" | "full";
  className?: string;
}) {
  return (
    <p
      className={cn(
        "font-ui text-caption uppercase",
        variant === "short"
          ? "rounded-inner border border-line-strong px-5 py-4 text-ink-badge"
          : "text-line-strong",
        className,
      )}
    >
      {variant === "short" ? disclaimers.fdaShort : disclaimers.fdaFull}
    </p>
  );
}

export { FdaDisclaimer };
