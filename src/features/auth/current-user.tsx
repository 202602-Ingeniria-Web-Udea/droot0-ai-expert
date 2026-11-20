"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { AuthUser } from "@/lib/contracts/auth";

const CurrentUserContext = createContext<AuthUser | null>(null);

type CurrentUserProviderProps = {
  user: AuthUser;
  children: ReactNode;
};

export function CurrentUserProvider({ user, children }: CurrentUserProviderProps) {
  return <CurrentUserContext.Provider value={user}>{children}</CurrentUserContext.Provider>;
}

/**
 * The signed-in user, as reported by `/api/auth/me`.
 *
 * The role is used only to decide what the interface shows. It is not a
 * security check: the backend authorizes every request on its own.
 */
export function useCurrentUser(): AuthUser {
  const user = useContext(CurrentUserContext);

  if (!user) {
    throw new Error("useCurrentUser must be used inside the authenticated app shell.");
  }

  return user;
}
