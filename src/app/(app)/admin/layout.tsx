import type { ReactNode } from "react";
import { Container, PageHeader } from "@/components/layout";
import { AdminGuard } from "@/features/admin/admin-guard";
import { AdminNav } from "@/features/admin/admin-nav";

export default function AdminLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <Container className="max-w-5xl py-8">
      <AdminGuard>
        <div className="space-y-6">
          <PageHeader
            title="Administration"
            description="Manage users, the assistant configuration, and application statistics."
          />
          <AdminNav />
          {children}
        </div>
      </AdminGuard>
    </Container>
  );
}
