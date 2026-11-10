"use client";

import * as React from "react";
import { AlertDialog } from "@base-ui/react/alert-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Modal de confirmación del panel. Reemplaza a window.confirm.
 *
 *   const confirm = useConfirm();
 *   if (await confirm({ title: "¿Quitar la tabla 2?", confirmLabel: "Quitar", tone: "danger" })) …
 *
 * Accesible (alertdialog, foco atrapado, Escape cancela) y con el estilo del panel.
 * El foco arranca en "Cancelar": para acciones que quitan algo es lo más seguro.
 */

export type ConfirmOptions = {
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** danger: acciones que quitan o publican algo visible. */
  tone?: "default" | "danger";
};

type Pending = ConfirmOptions & { resolve: (ok: boolean) => void };

const ConfirmContext = React.createContext<((options: ConfirmOptions) => Promise<boolean>) | null>(
  null,
);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [pending, setPending] = React.useState<Pending | null>(null);
  const [open, setOpen] = React.useState(false);

  const confirm = React.useCallback(
    (options: ConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        setPending({ ...options, resolve });
        setOpen(true);
      }),
    [],
  );

  const close = (ok: boolean) => {
    pending?.resolve(ok);
    setOpen(false);
  };

  return (
    <ConfirmContext value={confirm}>
      {children}
      <AlertDialog.Root
        open={open}
        onOpenChange={(next) => {
          if (!next) close(false);
        }}
        onOpenChangeComplete={(next) => {
          if (!next) setPending(null);
        }}
      >
        <AlertDialog.Portal>
          <AlertDialog.Backdrop className="fixed inset-0 z-50 bg-brand-ink/40 transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0" />
          <AlertDialog.Popup className="fixed top-1/2 left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 flex-col gap-5 rounded-card-lg bg-surface p-6 shadow-lg ring-1 ring-line transition-all duration-150 outline-none data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0">
            <div className="flex flex-col gap-2">
              <AlertDialog.Title className="font-heading text-h3-sm font-semibold text-brand-ink">
                {pending?.title}
              </AlertDialog.Title>
              {pending?.description && (
                <AlertDialog.Description className="text-body-sm whitespace-pre-line text-ink-muted">
                  {pending.description}
                </AlertDialog.Description>
              )}
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <Button type="button" variant="outline" icon={null} onClick={() => close(false)}>
                {pending?.cancelLabel ?? "Cancelar"}
              </Button>
              <Button
                type="button"
                variant="solid"
                icon={null}
                onClick={() => close(true)}
                className={cn(
                  pending?.tone === "danger" && "bg-destructive hover:bg-destructive/85",
                )}
              >
                {pending?.confirmLabel ?? "Confirmar"}
              </Button>
            </div>
          </AlertDialog.Popup>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </ConfirmContext>
  );
}

export function useConfirm() {
  const confirm = React.use(ConfirmContext);
  if (!confirm)
    throw new Error("useConfirm necesita <ConfirmProvider> (app/admin/(panel)/layout.tsx).");
  return confirm;
}
