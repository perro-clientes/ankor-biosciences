"use client";

import * as React from "react";
import Link from "next/link";
import { Upload } from "lucide-react";
import type { FormState } from "@/lib/auth/actions";
import { uploadPdfAction } from "@/lib/coa/actions";
import { FieldError, FormAlert } from "@/components/admin/form-bits";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

const initialState: FormState = { status: "idle" };
const MAX_MB = 4;

export function UploadForm({
  documentId,
  nextVersion,
  hasDraft,
}: {
  documentId: string;
  nextVersion: number;
  hasDraft: boolean;
}) {
  const [state, action, pending] = React.useActionState(uploadPdfAction, initialState);
  const [file, setFile] = React.useState<File | null>(null);
  const [confirmed, setConfirmed] = React.useState(false);
  const errors = state.status === "error" ? (state.fieldErrors ?? {}) : {};
  const tooBig = file !== null && file.size > MAX_MB * 1024 * 1024;

  return (
    <form action={action} className="flex flex-col gap-6">
      <input type="hidden" name="documentId" value={documentId} />
      {state.status === "error" && !Object.keys(errors).length && (
        <FormAlert tone="error">{state.message}</FormAlert>
      )}
      {hasDraft && (
        <FormAlert tone="error">
          Este lote tiene un borrador del formulario sin publicar. Subir un PDF lo descarta.
        </FormAlert>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="pdf">Archivo PDF</Label>
        <input
          id="pdf"
          name="pdf"
          type="file"
          accept="application/pdf,.pdf"
          required
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="block w-full rounded-lg border border-input bg-surface text-sm text-ink-muted file:mr-4 file:min-h-target file:cursor-pointer file:border-0 file:bg-surface-tint file:px-4 file:font-ui file:text-button file:font-bold file:tracking-[0.06em] file:text-brand-ink file:uppercase"
          aria-describedby="pdf-hint"
        />
        <p id="pdf-hint" className="text-xs font-normal text-ink-muted">
          Hasta {MAX_MB} MB. Se publica tal cual, como versión {nextVersion}.
        </p>
        {tooBig && <FieldError id="pdf-size" message={`El archivo supera los ${MAX_MB} MB.`} />}
        <FieldError id="pdf-error" message={errors.pdf} />
      </div>

      <div className="flex flex-col gap-1.5 rounded-card border border-line-strong bg-surface-muted p-4">
        <Label className="flex items-start gap-3 font-body text-body-sm leading-snug font-normal">
          <Checkbox
            name="confirm"
            checked={confirmed}
            onCheckedChange={(v) => setConfirmed(v === true)}
            aria-labelledby="upload-confirm-label"
            className="mt-0.5"
          />
          <span id="upload-confirm-label">
            Revisé el PDF. Entiendo que al subirlo pasa a ser lo que muestra la URL del QR.
          </span>
        </Label>
        <FieldError id="confirm-error" message={errors.confirm} />
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <Button
          type="submit"
          variant="solid"
          icon={Upload}
          disabled={pending || !file || tooBig || !confirmed}
        >
          {pending ? "Subiendo…" : `Publicar como versión ${nextVersion}`}
        </Button>
        <Link
          href={`/admin/lotes/${documentId}`}
          className="text-sm text-ink-muted underline-offset-2 hover:underline"
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}
