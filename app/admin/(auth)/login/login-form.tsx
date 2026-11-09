"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signIn, type FormState } from "@/lib/auth/actions";
import { RECOVER_PATH } from "@/lib/auth/routing";
import { FieldError, FormAlert } from "@/components/admin/form-bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: FormState = { status: "idle" };

const LINK_ERROR =
  "El link no es válido o ya venció (cada link sirve una sola vez). Pedí uno nuevo desde “¿Olvidaste tu contraseña?” o pedile al admin que te reenvíe la invitación.";

export function LoginForm() {
  const params = useSearchParams();
  const [state, action, pending] = React.useActionState(signIn, initialState);
  const errors = state.status === "error" ? (state.fieldErrors ?? {}) : {};
  const showLinkError = params.get("error") === "link" && state.status === "idle";

  return (
    <form action={action} className="flex flex-col gap-5">
      {state.status === "error" && !Object.keys(errors).length && (
        <FormAlert tone="error">{state.message}</FormAlert>
      )}
      {showLinkError && <FormAlert tone="error">{LINK_ERROR}</FormAlert>}
      <input type="hidden" name="next" value={params.get("next") ?? ""} />

      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          inputMode="email"
          required
          autoFocus
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "email-error" : undefined}
        />
        <FieldError id="email-error" message={errors.email} />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-4">
          <Label htmlFor="password">Contraseña</Label>
          <Link
            href={RECOVER_PATH}
            className="text-sm font-normal text-brand-green underline underline-offset-2 hover:text-brand-ink"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          aria-invalid={!!errors.password}
          aria-describedby={errors.password ? "password-error" : undefined}
        />
        <FieldError id="password-error" message={errors.password} />
      </div>

      <Button variant="solid" type="submit" disabled={pending} icon={null} className="self-start">
        {pending ? "Ingresando…" : "Ingresar"}
      </Button>
    </form>
  );
}
