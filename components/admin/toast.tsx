"use client";

import * as React from "react";
import { CircleAlert, CircleCheck, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Avisos breves del panel (toasts), abajo a la derecha.
 *
 *   const toast = useToast();
 *   toast({ message: "Tabla 2 quitada", action: { label: "Deshacer", onClick: restore } });
 *
 * Se anuncian a lectores de pantalla (aria-live) y desaparecen solos
 * (más tiempo si tienen una acción). Pasar el mouse por encima los pausa.
 */

export type ToastOptions = {
  message: string;
  tone?: "ok" | "error";
  action?: { label: string; onClick: () => void };
  /** ms; por defecto 4 s, o 7 s si hay acción. */
  duration?: number;
};

type ToastItem = ToastOptions & { id: number };

const ToastContext = React.createContext<((options: ToastOptions) => void) | null>(null);

let nextId = 0;

function ToastCard({ item, onClose }: { item: ToastItem; onClose: () => void }) {
  const [paused, setPaused] = React.useState(false);
  const duration = item.duration ?? (item.action ? 7000 : 4000);
  // Ref: que el timer no se reinicie cada vez que aparece otro toast.
  const onCloseRef = React.useRef(onClose);
  React.useEffect(() => {
    onCloseRef.current = onClose;
  });

  React.useEffect(() => {
    if (paused) return;
    const timer = setTimeout(() => onCloseRef.current(), duration);
    return () => clearTimeout(timer);
  }, [paused, duration]);

  const Icon = item.tone === "error" ? CircleAlert : CircleCheck;
  return (
    <li
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className="pointer-events-auto flex items-center gap-3 rounded-card bg-brand-ink py-2 pr-2 pl-4 text-sm text-white shadow-lg motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2"
    >
      <Icon
        aria-hidden="true"
        className={cn(
          "size-4 shrink-0",
          item.tone === "error" ? "text-white" : "text-brand-green-light",
        )}
      />
      <span className="flex-1 py-1.5">{item.message}</span>
      {item.action && (
        <button
          type="button"
          onClick={() => {
            item.action?.onClick();
            onClose();
          }}
          className="min-h-9 rounded-lg px-3 font-ui text-button font-bold tracking-[0.06em] text-brand-green-light uppercase hover:bg-white/10"
        >
          {item.action.label}
        </button>
      )}
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar aviso"
        className="flex size-9 items-center justify-center rounded-lg text-white/70 hover:bg-white/10 hover:text-white"
      >
        <X aria-hidden="true" className="size-4" />
      </button>
    </li>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<ToastItem[]>([]);

  const toast = React.useCallback((options: ToastOptions) => {
    nextId += 1;
    // Máximo 3 a la vez: el más viejo se va.
    setItems((current) => [...current.slice(-2), { ...options, id: nextId }]);
  }, []);

  const remove = React.useCallback(
    (id: number) => setItems((current) => current.filter((t) => t.id !== id)),
    [],
  );

  return (
    <ToastContext value={toast}>
      {children}
      <ol
        aria-live="polite"
        aria-label="Avisos"
        className="pointer-events-none fixed right-4 bottom-4 left-4 z-60 flex flex-col items-stretch gap-2 sm:left-auto sm:w-96"
      >
        {items.map((item) => (
          <ToastCard key={item.id} item={item} onClose={() => remove(item.id)} />
        ))}
      </ol>
    </ToastContext>
  );
}

export function useToast() {
  const toast = React.use(ToastContext);
  if (!toast) throw new Error("useToast necesita <ToastProvider> (app/admin/(panel)/layout.tsx).");
  return toast;
}
