"use client";

import * as React from "react";
import type { FormState } from "@/lib/auth/actions";
import { inviteUser } from "@/lib/auth/users-actions";
import { FieldError, FormAlert } from "@/components/admin/form-bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";

const initialState: FormState = { status: "idle" };

export function InviteForm() {
  const formRef = React.useRef<HTMLFormElement>(null);
  const [state, action, pending] = React.useActionState(inviteUser, initialState);
  const errors = state.status === "error" ? (state.fieldErrors ?? {}) : {};

  React.useEffect(() => {
    if (state.status === "done") formRef.current?.reset();
  }, [state]);

  // "Nuevo usuario" desde el Dashboard llega con #invitar: foco directo en el email.
  React.useEffect(() => {
    if (window.location.hash === "#invitar") {
      document.getElementById("invite-email")?.focus();
    }
  }, []);

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-4">
      {state.status === "done" && <FormAlert tone="ok">{state.message}</FormAlert>}
      {state.status === "error" && !Object.keys(errors).length && (
        <FormAlert tone="error">{state.message}</FormAlert>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_200px_auto] sm:items-end">
        <div className="flex flex-col gap-2">
          <Label htmlFor="invite-email">Email</Label>
          <Input
            id="invite-email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="off"
            required
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "invite-email-error" : undefined}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="invite-role">Rol</Label>
          <NativeSelect id="invite-role" name="role" defaultValue="editor">
            <option value="editor">Editor</option>
            <option value="admin">Administrador</option>
          </NativeSelect>
        </div>
        <Button variant="solid" type="submit" disabled={pending} icon={null}>
          {pending ? "Enviando…" : "Invitar"}
        </Button>
      </div>
      <FieldError id="invite-email-error" message={errors.email} />
      <p className="text-sm font-normal text-ink-muted">
        Le llega un email con un link para elegir su contraseña. Editor: crea lotes y publica COAs.
        Administrador: además gestiona usuarios.
      </p>
    </form>
  );
}
