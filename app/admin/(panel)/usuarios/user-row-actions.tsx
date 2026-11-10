"use client";

import * as React from "react";
import type { FormState } from "@/lib/auth/actions";
import { resendInvite, setUserRole } from "@/lib/auth/users-actions";
import type { PanelUser } from "@/lib/auth/users";
import { useConfirm } from "@/components/admin/confirm";
import { FormAlert } from "@/components/admin/form-bits";
import { useToast } from "@/components/admin/toast";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";

const initialState: FormState = { status: "idle" };

export function UserRowActions({ user, isSelf }: { user: PanelUser; isSelf: boolean }) {
  const [roleState, roleAction, rolePending] = React.useActionState(setUserRole, initialState);
  const [inviteState, inviteAction, invitePending] = React.useActionState(
    resendInvite,
    initialState,
  );
  const [, startTransition] = React.useTransition();
  const confirm = useConfirm();
  const toast = useToast();

  // Éxitos → toast; errores → aviso junto a la fila.
  React.useEffect(() => {
    if (roleState.status === "done") toast({ message: roleState.message });
  }, [roleState, toast]);
  React.useEffect(() => {
    if (inviteState.status === "done") toast({ message: inviteState.message });
  }, [inviteState, toast]);
  const error =
    inviteState.status === "error" ? inviteState : roleState.status === "error" ? roleState : null;

  const onRoleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    if (formData.get("role") === "none") {
      const ok = await confirm({
        title: `¿Quitarle el acceso a ${user.email}?`,
        description:
          "No va a poder ingresar al panel. Para devolvérselo, volvé a invitarlo desde esta pantalla.",
        confirmLabel: "Quitar acceso",
        tone: "danger",
      });
      if (!ok) return;
    }
    startTransition(() => roleAction(formData));
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <form action={roleAction} onSubmit={onRoleSubmit} className="flex items-center gap-2">
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
      {error && <FormAlert tone="error">{error.message}</FormAlert>}
    </div>
  );
}
