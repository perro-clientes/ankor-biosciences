import type { LucideIcon } from "lucide-react";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

/** Ícono + título + texto sobre surface-muted. */
function FeatureCard({
  icon,
  title,
  text,
  className,
}: {
  icon: LucideIcon;
  title: string;
  text: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-h-[260px] flex-col gap-10 rounded-card bg-surface-muted px-7 py-8",
        className,
      )}
    >
      <Icon icon={icon} strokeWidth={1.5} className="size-11 text-brand-green" />
      <div className="flex flex-col gap-2.5">
        <h3 className="text-2xl leading-tight font-semibold text-brand-ink">{title}</h3>
        <p className="text-body-sm text-ink-muted">{text}</p>
      </div>
    </div>
  );
}

export { FeatureCard };
