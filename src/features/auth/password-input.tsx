"use client";

import { useState, type ComponentProps } from "react";
import { Input } from "@/components/ui";

type PasswordInputProps = Omit<ComponentProps<"input">, "type">;

/** Password field with a button to show or hide what was typed. */
export function PasswordInput({ className, ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input
        type={visible ? "text" : "password"}
        className={`pr-16 ${className ?? ""}`}
        {...props}
      />
      <button
        type="button"
        aria-pressed={visible}
        aria-label={visible ? "Hide password" : "Show password"}
        onClick={() => setVisible((current) => !current)}
        className="absolute inset-y-1 right-1 rounded-control px-2.5 text-sm font-medium text-ink-muted hover:text-ink"
      >
        {visible ? "Hide" : "Show"}
      </button>
    </div>
  );
}
