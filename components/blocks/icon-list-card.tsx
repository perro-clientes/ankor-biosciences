import type { LucideIcon } from "lucide-react";
import { Icon } from "@/components/ui/icon";

/** Ícono en círculo + texto. */
function IconListCard({ icon, text }: { icon: LucideIcon; text: string }) {
  return (
    <li className="flex items-start gap-4 rounded-card bg-surface-muted p-7">
      <span className="flex size-target flex-none items-center justify-center rounded-pill bg-surface">
        <Icon icon={icon} strokeWidth={1.8} className="size-5 text-brand-green" />
      </span>
      <p className="font-heading text-item font-medium text-brand-ink">{text}</p>
    </li>
  );
}

export { IconListCard };
