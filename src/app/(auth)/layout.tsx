import type { ReactNode } from "react";
import { Brand } from "@/components/layout";

export default function AuthLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="flex min-h-screen flex-col items-center px-4 py-10 sm:justify-center sm:py-16">
      <Brand className="mb-8" />
      <main className="w-full max-w-md rounded-dialog border border-line bg-surface p-6 shadow-raised sm:p-8">
        {children}
      </main>
    </div>
  );
}
