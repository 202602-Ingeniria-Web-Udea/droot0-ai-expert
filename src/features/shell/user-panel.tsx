"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge, Button, useToast } from "@/components/ui";
import { useCurrentUser } from "@/features/auth/current-user";
import { logout } from "@/lib/api/auth";
import { describeApiError } from "@/lib/api/errors";

function initialsOf(name: string, email: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const letters = words.length > 1 ? `${words[0][0]}${words[words.length - 1][0]}` : words[0]?.[0];

  return (letters ?? email[0] ?? "?").toUpperCase();
}

/** Signed-in user summary with the sign-out action. */
export function UserPanel() {
  const user = useCurrentUser();
  const router = useRouter();
  const { toast } = useToast();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);

    try {
      await logout();
      router.replace("/login");
      router.refresh();
    } catch (error) {
      setSigningOut(false);
      toast({
        variant: "error",
        title: "Could not sign out",
        description: describeApiError(error),
      });
    }
  }

  return (
    <div className="space-y-3 border-t border-line pt-4">
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-primary-hover"
        >
          {initialsOf(user.name, user.email)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink">{user.name}</p>
          <p className="truncate text-xs text-ink-muted">{user.email}</p>
        </div>
        <Badge variant={user.role === "ADMIN" ? "primary" : "neutral"}>{user.role}</Badge>
      </div>
      <Button
        variant="secondary"
        size="sm"
        className="w-full"
        loading={signingOut}
        onClick={handleSignOut}
      >
        {signingOut ? "Signing out" : "Sign out"}
      </Button>
    </div>
  );
}
