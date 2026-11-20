import type { Metadata } from "next";
import { RegisterForm } from "@/features/auth/register-form";

export const metadata: Metadata = { title: "Create account" };

export default function RegisterPage() {
  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight text-ink">Create your account</h1>
      <p className="mt-1 mb-6 text-sm text-ink-muted">
        Your conversations are saved so you can return to them.
      </p>
      <RegisterForm />
    </>
  );
}
