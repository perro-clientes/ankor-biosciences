"use client";

import * as React from "react";
import type { FormState } from "@/lib/auth/actions";
import { republishAction } from "@/lib/coa/actions";
import { useConfirm } from "@/components/admin/confirm";
import { FormAlert } from "@/components/admin/form-bits";
import { Button } from "@/components/ui/button";

const initialState: FormState = { status: "idle" };

/** "Volver a publicar" una versión anterior: la URL pasa a mostrarla en el acto. */
export function RepublishButton({
  documentId,
  versionId,
  version,
}: {
  documentId: string;
  versionId: string;
  version: number;
}) {
  const [state, action, pending] = React.useActionState(republishAction, initialState);
  const [, startTransition] = React.useTransition();
  const confirm = useConfirm();

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const ok = await confirm({
      title: `¿Volver a publicar la versión ${version}?`,
      description:
        "La URL del QR pasa a mostrar esa versión en el acto. Las demás quedan guardadas.",
      confirmLabel: `Publicar versión ${version}`,
    });
    if (ok) startTransition(() => action(formData));
  };

  return (
    <form action={action} onSubmit={onSubmit} className="flex flex-col items-end gap-2">
      <input type="hidden" name="documentId" value={documentId} />
      <input type="hidden" name="versionId" value={versionId} />
      <Button type="submit" variant="ghost" icon={null} disabled={pending}>
        {pending ? "Publicando…" : "Volver a publicar"}
      </Button>
      {state.status === "error" && <FormAlert tone="error">{state.message}</FormAlert>}
    </form>
  );
}
