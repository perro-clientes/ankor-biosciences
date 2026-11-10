"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronDown, LogOut, UserRound } from "lucide-react";
import { signOut } from "@/lib/auth/actions";
import { ROLE_LABEL, initialsFor } from "@/lib/auth/display";
import { PROFILE_PATH } from "@/lib/auth/routing";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function UserMenu({ email, role }: { email: string; role: "admin" | "editor" | null }) {
  const [pending, startTransition] = React.useTransition();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex min-h-target items-center gap-2 rounded-pill py-1 pr-2 pl-1 outline-none hover:bg-surface-tint focus-visible:ring-3 focus-visible:ring-ring/50 data-popup-open:bg-surface-tint"
        aria-label={`Cuenta de ${email}`}
      >
        <Avatar size="lg">
          <AvatarFallback className="bg-brand-green font-ui text-xs font-bold text-white">
            {initialsFor(email)}
          </AvatarFallback>
        </Avatar>
        <ChevronDown aria-hidden="true" className="size-4 text-ink-muted" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="w-64 p-1.5">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex flex-col gap-0.5 px-2 py-2">
            <span className="truncate text-sm font-medium text-brand-ink">{email}</span>
            <span className="text-xs font-normal text-ink-muted">
              {role ? ROLE_LABEL[role] : "Sin rol asignado"}
            </span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="min-h-10 px-2 text-sm" render={<Link href={PROFILE_PATH} />}>
          <UserRound aria-hidden="true" />
          Perfil
        </DropdownMenuItem>
        <DropdownMenuItem
          className="min-h-10 px-2 text-sm"
          variant="destructive"
          disabled={pending}
          onClick={() => startTransition(() => signOut())}
        >
          <LogOut aria-hidden="true" />
          {pending ? "Saliendo…" : "Salir"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
