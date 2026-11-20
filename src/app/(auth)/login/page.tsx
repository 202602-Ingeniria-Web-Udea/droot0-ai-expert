import type { Metadata } from "next";
import { LoginForm } from "@/features/auth/login-form";
import { getSafeReturnTo } from "@/lib/utils/return-to";

export const metadata: Metadata = { title: "Log in" };

type LoginPageProps = {
  searchParams: Promise<{ returnTo?: string | string[] }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { returnTo } = await searchParams;
  // Only internal paths are accepted; anything else falls back to /chat.
  const safeReturnTo = getSafeReturnTo(typeof returnTo === "string" ? returnTo : null);

  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight text-ink">Log in</h1>
      <p className="mt-1 mb-6 text-sm text-ink-muted">Continue your conversations.</p>
      <LoginForm returnTo={safeReturnTo} />
    </>
  );
}
