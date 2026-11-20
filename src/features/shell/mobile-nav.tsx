"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useState } from "react";
import { Brand } from "@/components/layout";
import { SidebarNav } from "./sidebar-nav";
import { UserPanel } from "./user-panel";

/**
 * Navigation drawer for small screens.
 * Radix Dialog traps focus inside it, closes it with Escape, and returns
 * focus to the menu button.
 */
export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger
        aria-label="Open navigation"
        className="inline-flex size-10 items-center justify-center rounded-control text-ink hover:bg-sunken"
      >
        <svg
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          aria-hidden="true"
          className="size-5"
        >
          <path d="M3.5 5.5h13M3.5 10h13M3.5 14.5h13" />
        </svg>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 animate-overlay-in bg-ink/50" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] animate-overlay-in flex-col gap-6 overflow-y-auto bg-surface p-4 shadow-overlay"
        >
          <div className="flex items-center justify-between">
            <Dialog.Title className="sr-only">Navigation</Dialog.Title>
            <Brand href="/chat" />
            <Dialog.Close
              aria-label="Close navigation"
              className="inline-flex size-9 items-center justify-center rounded-control text-ink-muted hover:bg-sunken hover:text-ink"
            >
              <svg
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                aria-hidden="true"
                className="size-5"
              >
                <path d="m5.5 5.5 9 9M14.5 5.5l-9 9" />
              </svg>
            </Dialog.Close>
          </div>
          <SidebarNav onNavigate={() => setOpen(false)} />
          <div className="mt-auto">
            <UserPanel />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
