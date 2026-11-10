"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, Users, type LucideIcon } from "lucide-react";
import { HOME_PATH, LOTS_PATH, USERS_PATH } from "@/lib/auth/routing";
import { cn } from "@/lib/utils";

type Item = { href: string; label: string; icon: LucideIcon; show: boolean };

/** Sidebar del panel: vertical desde md, tira horizontal en mobile. */
export function Sidebar({ role }: { role: "admin" | "editor" | null }) {
  const pathname = usePathname();
  const items: Item[] = [
    { href: HOME_PATH, label: "Dashboard", icon: LayoutDashboard, show: true },
    { href: LOTS_PATH, label: "Lotes", icon: Package, show: role !== null },
    { href: USERS_PATH, label: "Usuarios", icon: Users, show: role === "admin" },
  ];

  const isActive = (href: string) =>
    href === HOME_PATH ? pathname === HOME_PATH : pathname.startsWith(href);

  return (
    <nav aria-label="Secciones del panel">
      <ul className="flex gap-1 overflow-x-auto md:flex-col">
        {items
          .filter((i) => i.show)
          .map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex min-h-target items-center gap-3 rounded-lg px-3 text-sm font-medium whitespace-nowrap text-ink-muted transition-colors hover:bg-surface-tint hover:text-brand-ink",
                    active && "bg-surface-tint text-brand-ink",
                  )}
                >
                  <Icon
                    aria-hidden="true"
                    className={cn("size-[18px]", active ? "text-brand-green" : "text-ink-muted")}
                  />
                  {label}
                </Link>
              </li>
            );
          })}
      </ul>
    </nav>
  );
}
