"use client";

import * as React from "react";
import Link from "next/link";
import type { FormState } from "@/lib/auth/actions";
import { createLot } from "@/lib/lots/actions";
import { NEW_LOT_PREFIX, publicPdfUrl } from "@/lib/lots/naming";
import { FieldError, FormAlert } from "@/components/admin/form-bits";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: FormState = { status: "idle" };

export function NewLotForm({ fileName, label }: { fileName: string; label: string }) {
  const [state, action, pending] = React.useActionState(createLot, initialState);
  const [name, setName] = React.useState(fileName);
  const [confirmed, setConfirmed] = React.useState(false);
  const errors = state.status === "error" ? (state.fieldErrors ?? {}) : {};

  return (
    <form action={action} className="flex flex-col gap-6">
      {state.status === "error" && !Object.keys(errors).length && (
        <FormAlert tone="error">{state.message}</FormAlert>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="label">Etiqueta</Label>
        <Input
          id="label"
          name="label"
          defaultValue={label}
          required
          maxLength={60}
          aria-invalid={!!errors.label}
          aria-describedby={`label-hint${errors.label ? " label-error" : ""}`}
        />
        <p id="label-hint" className="text-sm font-normal text-ink-muted">
          Nombre interno para reconocerlo en el panel. Se puede cambiar después.
        </p>
        <FieldError id="label-error" message={errors.label} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="fileName">Nombre del archivo</Label>
        <Input
          id="fileName"
          name="fileName"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setConfirmed(false);
          }}
          required
          maxLength={200}
          spellCheck={false}
          autoComplete="off"
          className="font-mono text-sm"
          aria-invalid={!!errors.fileName}
          aria-describedby={`fileName-hint${errors.fileName ? " fileName-error" : ""}`}
        />
        <p id="fileName-hint" className="text-sm font-normal text-ink-muted">
          Va en la URL del QR:{" "}
          <span className="font-mono break-all text-brand-ink">
            {publicPdfUrl(name || "…", NEW_LOT_PREFIX)}
          </span>
        </p>
        <FieldError id="fileName-error" message={errors.fileName} />
      </div>

      <div className="flex flex-col gap-1.5 rounded-card border border-line-strong bg-surface-muted p-4">
        <Label className="flex items-start gap-3 font-body text-body-sm leading-snug font-normal">
          <Checkbox
            name="confirm"
            checked={confirmed}
            onCheckedChange={(v) => setConfirmed(v === true)}
            aria-labelledby="confirm-label"
            aria-invalid={!!errors.confirm}
            className="mt-0.5"
          />
          <span id="confirm-label">
            Revisé el nombre del archivo. Entiendo que <strong>no se puede cambiar</strong> después
            de crear el lote, porque es lo que queda impreso en el QR.
          </span>
        </Label>
        <FieldError id="confirm-error" message={errors.confirm} />
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <Button variant="solid" type="submit" disabled={pending || !confirmed} icon={null}>
          {pending ? "Creando…" : "Crear lote"}
        </Button>
        <Link href="/admin/lotes" className="text-sm text-brand-green underline underline-offset-2">
          Cancelar
        </Link>
      </div>
      <p className="text-sm font-normal text-ink-muted">
        Al crearlo, la URL empieza a mostrar un PDF provisorio (logo y disclaimer) hasta que se
        publique el COA.
      </p>
    </form>
  );
}
