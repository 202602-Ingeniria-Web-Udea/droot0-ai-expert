import type { ReactNode } from "react";
import { SkipLink } from "@/components/layout";
import { SiteFooter } from "@/features/marketing/site-footer";
import { SiteHeader } from "@/features/marketing/site-header";

export default function MarketingLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="flex min-h-screen flex-col">
      <SkipLink />
      <SiteHeader />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
