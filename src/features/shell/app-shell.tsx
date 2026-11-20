"use client";

import type { ReactNode } from "react";
import { Brand, SkipLink } from "@/components/layout";
import { ErrorState, Spinner } from "@/components/ui";
import { CurrentUserProvider } from "@/features/auth/current-user";
import { getMe } from "@/lib/api/auth";
import { describeApiError } from "@/lib/api/errors";
import { useAsyncData } from "@/lib/api/use-async-data";
import { MobileNav } from "./mobile-nav";
import { SidebarNav } from "./sidebar-nav";
import { UserPanel } from "./user-panel";

/**
 * Persistent layout of the authenticated area: sidebar on large screens,
 * top bar with a drawer on small ones.
 *
 * It loads the current user from `/api/auth/me` before rendering any page.
 * A 401 answer sends the browser to the login page (handled by useAsyncData);
 * `src/proxy.ts` already redirects requests that arrive without a session.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const me = useAsyncData("me", (signal) => getMe(signal));

  if (me.status === "loading") {
    return (
      <div className="flex h-dvh items-center justify-center gap-3 text-sm text-ink-muted">
        <Spinner label="" className="text-primary" />
        <p role="status">Loading your workspace</p>
      </div>
    );
  }

  if (me.status === "error") {
    return (
      <div className="flex h-dvh items-center justify-center p-4">
        <ErrorState
          headingLevel="h2"
          title="Your workspace could not be loaded"
          description={describeApiError(me.error)}
          onRetry={me.reload}
          className="w-full max-w-md"
        />
      </div>
    );
  }

  return (
    <CurrentUserProvider user={me.data.user}>
      <div className="flex h-dvh">
        <SkipLink />

        <aside className="hidden w-64 shrink-0 flex-col gap-6 border-r border-line bg-surface p-4 lg:flex">
          <Brand href="/chat" />
          <SidebarNav />
          <div className="mt-auto">
            <UserPanel />
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-14 shrink-0 items-center gap-2 border-b border-line bg-surface px-2 lg:hidden">
            <MobileNav />
            <Brand href="/chat" />
          </header>

          <main
            id="main-content"
            tabIndex={-1}
            className="min-h-0 flex-1 overflow-y-auto outline-none"
          >
            {children}
          </main>
        </div>
      </div>
    </CurrentUserProvider>
  );
}
