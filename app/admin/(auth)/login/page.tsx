import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthCard } from "@/components/admin/form-bits";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Ingresar" };

export default function LoginPage() {
  return (
    <AuthCard
      title="Ingresar al panel"
      intro="Solo pueden ingresar las personas invitadas por un administrador."
    >
      {/* useSearchParams (?next=, ?error=) necesita un Suspense con Cache Components. */}
      <Suspense fallback={<div className="h-56" />}>
        <LoginForm />
      </Suspense>
    </AuthCard>
  );
}
