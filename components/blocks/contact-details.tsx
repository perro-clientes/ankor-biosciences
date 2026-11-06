import { Mail, MapPin, Phone, type LucideIcon } from "lucide-react";
import { contact } from "@/content/site";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

/**
 * Email, teléfono con horario y dirección. Única fuente: content/site.ts.
 * - default: filas con ícono (home y /contact).
 * - compact: lista simple para el footer (sobre oscuro).
 */
function ContactDetails({
  variant = "default",
  className,
}: {
  variant?: "default" | "compact";
  className?: string;
}) {
  const { email, phone, address } = contact;

  if (variant === "compact") {
    return (
      <address className={cn("flex flex-col gap-3 text-sm not-italic", className)}>
        <a href={`mailto:${email}`} className="text-white hover:text-brand-green-light">
          {email}
        </a>
        <a href={phone.href} className="text-white hover:text-brand-green-light">
          {phone.display}
        </a>
        <span className="text-on-dark">
          {address.street}
          <br />
          {address.city}, {address.region} {address.postalCode}
        </span>
      </address>
    );
  }

  return (
    <address className={cn("flex flex-col not-italic", className)}>
      <Row icon={Mail} href={`mailto:${email}`} label="Email">
        <Value>{email}</Value>
      </Row>
      <Row icon={Phone} href={phone.href} label={`Phone · ${phone.hours}`}>
        <Value>{phone.display}</Value>
      </Row>
      <Row icon={MapPin} label={address.label} last>
        <Value>
          {address.building}, {address.street}
        </Value>
        <span className="text-body-sm text-ink-muted">
          {address.city}, {address.region} {address.postalCode}, {address.country}
        </span>
      </Row>
    </address>
  );
}

function Row({
  icon,
  href,
  label,
  last,
  children,
}: {
  icon: LucideIcon;
  href?: string;
  label: string;
  last?: boolean;
  children: React.ReactNode;
}) {
  const className = cn(
    "flex items-start gap-4 border-t border-line-strong py-5 text-brand-ink",
    last && "border-b",
    href && "group transition-colors hover:text-brand-green",
  );
  const body = (
    <>
      <span className="flex size-target flex-none items-center justify-center rounded-pill bg-surface">
        <Icon icon={icon} className="size-[18px] text-brand-green" />
      </span>
      <span className="flex flex-col gap-1">
        <span className="font-ui text-caption tracking-[0.08em] text-ink-muted uppercase">
          {label}
        </span>
        {children}
      </span>
    </>
  );
  return href ? (
    <a href={href} className={className}>
      {body}
    </a>
  ) : (
    <div className={className}>{body}</div>
  );
}

function Value({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-heading text-h3-sm leading-tight font-semibold break-words">
      {children}
    </span>
  );
}

export { ContactDetails };
