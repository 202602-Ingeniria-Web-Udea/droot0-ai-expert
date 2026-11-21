import type { ComponentProps } from "react";
import { cn } from "@/lib/utils/cn";
import { controlStyles } from "./input";

/** Native select with the same look as the other form controls. */
export function Select({ className, ...props }: ComponentProps<"select">) {
  return <select className={cn(controlStyles, "h-10 pr-8", className)} {...props} />;
}
