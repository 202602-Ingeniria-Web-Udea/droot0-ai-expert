import type { Metadata } from "next";
import { UsersTable } from "@/features/admin/users-table";

export const metadata: Metadata = { title: "Users" };

export default function AdminUsersPage() {
  return (
    <section aria-labelledby="users-heading" className="space-y-4">
      <h2 id="users-heading" className="text-lg font-semibold tracking-tight text-ink">
        Users
      </h2>
      <UsersTable />
    </section>
  );
}
