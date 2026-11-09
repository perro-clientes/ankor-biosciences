"use client";

import * as React from "react";
import { updatePassword, type FormState } from "@/lib/auth/actions";
import { PASSWORD_MIN } from "@/lib/auth/schemas";
import { FieldError, FormAlert } from "@/components/admin/form-bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: FormState = { status: "idle" };

export function PasswordForm({ email }: { email: string }) {
  const [state, action, pending] = React.useActionState(updatePassword, initialState);
  const errors = state.status === "error" ? (state.fieldErrors ?? {}) : {};

  return (
    <form action={action} className="flex flex-col gap-5">
      {state.status === "error" && !Object.keys(errors).length && (
        <FormAlert tone="error">{state.message}</FormAlert>
      )}
      {/* Para que el gestor de contraseñas asocie la clave nueva a este usuario. */}
      <input type="email" name="username" value={email} autoComplete="username" readOnly hidden />

      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Contraseña nueva</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={PASSWORD_MIN}
          required
          autoFocus
          aria-invalid={!!errors.password}
          aria-describedby={`password-hint${errors.password ? " password-error" : ""}`}
        />
        <p id="password-hint" className="text-sm font-normal text-ink-muted">
          Al menos {PASSWORD_MIN} caracteres. Mejor una frase larga que algo corto y complicado.
        </p>
        <FieldError id="password-error" message={errors.password} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="confirm">Repetí la contraseña</Label>
        <Input
          id="confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
          required
          aria-invalid={!!errors.confirm}
          aria-describedby={errors.confirm ? "confirm-error" : undefined}
        />
        <FieldError id="confirm-error" message={errors.confirm} />
      </div>

      <Button variant="solid" type="submit" disabled={pending} icon={null} className="self-start">
        {pending ? "Guardando…" : "Guardar contraseña"}
      </Button>
    </form>
  );
}
