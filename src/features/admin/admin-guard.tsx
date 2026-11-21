"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { EmptyState, buttonStyles } from "@/components/ui";
import { useCurrentUser } from "@/features/auth/current-user";

/**
 * Renders the administration area only for ADMIN users.
 *
 * This keeps the interface honest for someone who types an admin URL by hand,
 * but it is not the security boundary: every `/api/admin/*` route checks the
 * role on the server and answers 403 to anyone else.
 */
export function AdminGuard({ children }: { children: ReactNode }) {
  const user = useCurrentUser();

  if (user.role !== "ADMIN") {
    return (
      <EmptyState
        headingLevel="h2"
        title="You do not have access to this page"
        description="The administration area is available to administrators only."
        action={
          <Link href="/chat" className={buttonStyles({})}>
            Go to chat
          </Link>
        }
      />
    );
  }

  return <>{children}</>;
}
