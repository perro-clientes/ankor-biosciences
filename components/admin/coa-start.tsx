"use client";

import * as React from "react";
import { FilePenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { cn } from "@/lib/utils";

export type StartSource = { documentId: string; label: string; version: number };

/**
 * Cómo arrancar el COA de un lote que todavía no tiene uno:
 * plantilla base (estructura del Lote X, vacía) o copiar la estructura de otro
 * lote ya publicado (con o sin sus valores). Navega al editor por GET.
 */
export function CoaStartForm({
  documentId,
  sources,
}: {
  documentId: string;
  sources: StartSource[];
}) {
  const [mode, setMode] = React.useState<"base" | "copiar">(sources.length ? "copiar" : "base");
  const [keepValues, setKeepValues] = React.useState(false);

  const option = (
    value: "base" | "copiar",
    title: string,
    description: string,
    disabled = false,
  ) => (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-card border p-4 transition-colors",
        mode === value
          ? "border-brand-green bg-surface-tint"
          : "border-line hover:bg-surface-muted",
        disabled && "cursor-not-allowed opacity-50",
      )}
    >
      <input
        type="radio"
        name="modo"
        value={value}
        checked={mode === value}
        disabled={disabled}
        onChange={() => setMode(value)}
        className="mt-1 size-4 accent-brand-green"
      />
      <span className="flex flex-col gap-0.5">
        <span className="font-medium text-brand-ink">{title}</span>
        <span className="text-sm font-normal text-ink-muted">{description}</span>
      </span>
    </label>
  );

  return (
    <form method="get" action={`/admin/lotes/${documentId}/coa`} className="flex flex-col gap-4">
      {option(
        "copiar",
        "Copiar estructura de otro lote",
        sources.length
          ? "Mismas líneas, tablas y columnas que un COA ya publicado."
          : "Todavía no hay otros lotes con un COA cargado en el panel.",
        sources.length === 0,
      )}
      {mode === "copiar" && sources.length > 0 && (
        <div className="flex flex-col gap-3 pl-1">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="origen">Lote de origen</Label>
            <NativeSelect id="origen" name="origen" defaultValue={sources[0].documentId}>
              {sources.map((s) => (
                <option key={s.documentId} value={s.documentId}>
                  {s.label} (v{s.version})
                </option>
              ))}
            </NativeSelect>
          </div>
          <Label className="flex items-start gap-3 font-body text-body-sm leading-snug font-normal">
            <Checkbox
              name="valores"
              value="1"
              checked={keepValues}
              onCheckedChange={(v) => setKeepValues(v === true)}
              aria-labelledby="valores-label"
              className="mt-0.5"
            />
            <span id="valores-label">
              Copiar también los valores (después los corregís). Si no, quedan vacíos y se conservan
              las etiquetas y la primera columna de cada tabla.
            </span>
          </Label>
        </div>
      )}
      {option(
        "base",
        "Plantilla base",
        "La estructura del COA del Lote X, vacía: encabezado, Overview, Batch Result, analitos, notas y pie.",
      )}
      <Button type="submit" variant="solid" icon={FilePenLine} className="self-start">
        Empezar
      </Button>
    </form>
  );
}

/** Botón "Cargar COA" que abre el modal de inicio. */
export function CoaStartDialog(props: { documentId: string; sources: StartSource[] }) {
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="solid" icon={FilePenLine} />}>
        Cargar COA
      </DialogTrigger>
      <DialogContent className="gap-5 p-6 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading text-h3-sm font-semibold text-brand-ink">
            ¿Cómo querés empezar?
          </DialogTitle>
          <DialogDescription className="text-body-sm text-ink-muted">
            Después podés agregar, quitar y editar todas las líneas y tablas.
          </DialogDescription>
        </DialogHeader>
        <CoaStartForm {...props} />
      </DialogContent>
    </Dialog>
  );
}
