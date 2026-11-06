"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { headerCta, headerNav } from "@/content/site";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

/** Menú mobile (< lg) sobre el Sheet de shadcn: foco atrapado, Escape cierra. */
function MobileNav() {
  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button
            variant="outline"
            size="icon"
            icon={null}
            className="lg:hidden"
            aria-label="Open menu"
          />
        }
      >
        <Menu className="size-5" aria-hidden="true" />
      </SheetTrigger>
      <SheetContent side="right" className="w-full gap-0 p-6 pt-16">
        <SheetTitle className="sr-only">Menu</SheetTitle>
        <SheetDescription className="sr-only">Site navigation</SheetDescription>
        <nav aria-label="Mobile">
          <ul className="flex flex-col">
            {headerNav.map((link) => (
              <li key={link.href} className="border-t border-line last:border-b">
                <SheetClose
                  render={
                    <Link
                      href={link.href}
                      className="flex min-h-14 items-center font-heading text-item font-medium text-brand-ink hover:text-brand-green"
                    />
                  }
                  nativeButton={false}
                >
                  {link.label}
                </SheetClose>
              </li>
            ))}
          </ul>
        </nav>
        <SheetClose
          render={<Button href={headerCta.href} className="mt-8 self-start" />}
          nativeButton={false}
        >
          {headerCta.label}
        </SheetClose>
      </SheetContent>
    </Sheet>
  );
}

export { MobileNav };
