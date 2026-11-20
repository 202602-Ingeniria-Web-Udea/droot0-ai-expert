"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { buttonStyles } from "@/components/ui";
import { useCurrentUser } from "@/features/auth/current-user";
import { cn } from "@/lib/utils/cn";

function NavIcon({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="size-5 shrink-0"
    >
      {children}
    </svg>
  );
}

const NAV_ITEMS = [
  {
    href: "/chat",
    label: "Chat",
    adminOnly: false,
    icon: (
      <path d="M3.5 5.5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H9l-3.5 3v-3a2 2 0 0 1-2-2v-6Z" />
    ),
  },
  {
    href: "/history",
    label: "History",
    adminOnly: false,
    icon: (
      <>
        <circle cx="10" cy="10" r="6.75" />
        <path d="M10 6.5V10l2.5 1.5" />
      </>
    ),
  },
  {
    href: "/admin",
    label: "Admin",
    adminOnly: true,
    icon: <path d="M10 3 4.5 5v4.5c0 3.2 2.2 6 5.5 7.5 3.3-1.500 5.5-4.300 5.500-7.500V5L10 3Z" />,
  },
] as const;

type SidebarNavProps = {
  /** Called after a link is chosen, so the mobile drawer can close. */
  onNavigate?: () => void;
};

export function SidebarNav({ onNavigate }: SidebarNavProps) {
  const pathname = usePathname();
  const user = useCurrentUser();

  // Hiding the Admin link is a convenience, not a permission check:
  // the admin pages and every admin API route verify the role again.
  const items = NAV_ITEMS.filter((item) => !item.adminOnly || user.role === "ADMIN");

  return (
    <nav aria-label="Main" className="flex flex-col gap-4">
      <Link href="/chat" onClick={onNavigate} className={buttonStyles({ className: "w-full" })}>
        <NavIcon>
          <path d="M10 4.5v11M4.5 10h11" />
        </NavIcon>
        New chat
      </Link>

      <ul className="space-y-1">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-control px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary-soft text-primary-hover"
                    : "text-ink-muted hover:bg-sunken hover:text-ink",
                )}
              >
                <NavIcon>{item.icon}</NavIcon>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
