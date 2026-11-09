import type { LotKind, LotStatus } from "@/lib/lots/queries";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS: Record<LotStatus, string> = {
  pendiente: "Pendiente",
  borrador: "Borrador",
  publicado: "Publicado",
};

export const KIND_LABEL: Record<LotKind, string> = {
  legacy: "Sitio anterior",
  template: "Plantilla",
  upload: "PDF subido",
};

export function LotStatusBadge({ status }: { status: LotStatus }) {
  return (
    <Badge
      className={cn(
        status === "pendiente" && "bg-surface text-ink-badge ring-1 ring-line-strong",
        status === "borrador" && "bg-muted text-ink-muted",
      )}
    >
      {STATUS[status]}
    </Badge>
  );
}

const fmt = new Intl.DateTimeFormat("es-AR", {
  dateStyle: "medium",
  timeZone: "America/Argentina/Buenos_Aires",
});
export const shortDate = (iso: string | null) => (iso ? fmt.format(new Date(iso)) : "—");
