"use client";

import * as React from "react";
import Link from "next/link";
import { requestPasswordReset, type FormState } from "@/lib/auth/actions";
import { LOGIN_PATH } from "@/lib/auth/routing";
import { FieldError, FormAlert } from "@/components/admin/form-bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: FormState = { status: "idle" };

export function RecoverForm() {
  const [state, action, pending] = React.useActionState(requestPasswordReset, initialState);
  const errors = state.status === "error" ? (state.fieldErrors ?? {}) : {};

  if (state.status === "done") {
    return (
      <div className="flex flex-col gap-4">
        <FormAlert tone="ok">{state.message}</FormAlert>
        <Link href={LOGIN_PATH} className="text-sm text-brand-green underline underline-offset-2">
          Volver al login
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-5">
      {state.status === "error" && !errors.email && (
        <FormAlert tone="error">{state.message}</FormAlert>
      )}
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          autoFocus
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "email-error" : undefined}
        />
        <FieldError id="email-error" message={errors.email} />
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" disabled={pending} icon={null}>
          {pending ? "Enviando…" : "Enviarme el link"}
        </Button>
        <Link href={LOGIN_PATH} className="text-sm text-brand-green underline underline-offset-2">
          Volver al login
        </Link>
      </div>
    </form>
  );
}
