import type { Metadata } from "next";
import { AuthCard } from "@/components/admin/form-bits";
import { RecoverForm } from "./recover-form";

export const metadata: Metadata = { title: "Recuperar contraseña" };

export default function RecoverPage() {
  return (
    <AuthCard
      title="Recuperar contraseña"
      intro="Ingresá tu email y te mandamos un link para elegir una contraseña nueva."
    >
      <RecoverForm />
    </AuthCard>
  );
}
