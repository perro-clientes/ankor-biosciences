import type { Metadata } from "next";
import { Suspense } from "react";
import { requireUser } from "@/lib/auth/session";
import { AuthCard } from "@/components/admin/form-bits";
import { PasswordForm } from "./password-form";

export const metadata: Metadata = { title: "Contraseña" };

/** Elegir contraseña: al aceptar la invitación, al recuperarla o para cambiarla. */
export default function PasswordPage() {
  return (
    <Suspense fallback={<div className="h-72" />}>
      <PasswordCard />
    </Suspense>
  );
}

async function PasswordCard() {
  const user = await requireUser();
  return (
    <AuthCard
      title="Elegí tu contraseña"
      intro={
        <>
          Cuenta: <strong className="font-medium text-brand-ink">{user.email}</strong>
        </>
      }
    >
      <PasswordForm email={user.email} />
    </AuthCard>
  );
}
