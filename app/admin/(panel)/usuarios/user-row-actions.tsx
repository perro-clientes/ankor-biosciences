"use client";

import * as React from "react";
import type { FormState } from "@/lib/auth/actions";
import { resendInvite, setUserRole } from "@/lib/auth/users-actions";
import type { PanelUser } from "@/lib/auth/users";
import { FormAlert } from "@/components/admin/form-bits";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";

const initialState: FormState = { status: "idle" };

export function UserRowActions({ user, isSelf }: { user: PanelUser; isSelf: boolean }) {
  const [roleState, roleAction, rolePending] = React.useActionState(setUserRole, initialState);
  const [inviteState, inviteAction, invitePending] = React.useActionState(
    resendInvite,
    initialState,
  );
  const state = inviteState.status !== "idle" ? inviteState : roleState;

  const confirmRemoval = (event: React.FormEvent<HTMLFormElement>) => {
    const role = new FormData(event.currentTarget).get("role");
    if (role === "none" && !window.confirm(`¿Quitarle el acceso al panel a ${user.email}?`)) {
      event.preventDefault();
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <form action={roleAction} onSubmit={confirmRemoval} className="flex items-center gap-2">
          <input type="hidden" name="userId" value={user.id} />
          <NativeSelect
            name="role"
            defaultValue={user.role ?? "none"}
            aria-label={`Rol de ${user.email}`}
            disabled={isSelf}
            className="min-w-40"
          >
            <option value="editor">Editor</option>
            <option value="admin">Administrador</option>
            <option value="none">Sin acceso</option>
          </NativeSelect>
          {!isSelf && (
            <Button type="submit" variant="outline" icon={null} disabled={rolePending}>
              {rolePending ? "Guardando…" : "Guardar"}
            </Button>
          )}
        </form>
        {user.status === "pendiente" && (
          <form action={inviteAction}>
            <input type="hidden" name="userId" value={user.id} />
            <Button type="submit" variant="ghost" icon={null} disabled={invitePending}>
              {invitePending ? "Reenviando…" : "Reenviar invitación"}
            </Button>
          </form>
        )}
      </div>
      {state.status !== "idle" && (
        <FormAlert tone={state.status === "done" ? "ok" : "error"}>{state.message}</FormAlert>
      )}
    </div>
  );
}
