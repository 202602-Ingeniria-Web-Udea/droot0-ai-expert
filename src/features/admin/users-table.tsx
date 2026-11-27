"use client";

import { useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  EmptyState,
  ErrorState,
  Select,
  useToast,
} from "@/components/ui";
import { useCurrentUser } from "@/features/auth/current-user";
import { listUsers, updateUserRole } from "@/lib/api/admin";
import { isApiClientError } from "@/lib/api/client";
import { describeApiError } from "@/lib/api/errors";
import { redirectToLogin } from "@/lib/api/redirect";
import { useAsyncData } from "@/lib/api/use-async-data";
import type { AuthUser } from "@/lib/contracts/auth";
import { roleSchema, type Role } from "@/lib/contracts/common";
import { formatDate } from "@/lib/utils/format";

const ROLE_EFFECT: Record<Role, string> = {
  ADMIN: "Administrators can manage users, the assistant configuration, and statistics.",
  USER: "Users can chat and manage their own conversations only.",
};

type RoleChange = { user: AuthUser; role: Role };

function TableSkeleton() {
  return (
    <div role="status" className="space-y-2">
      <span className="sr-only">Loading users</span>
      {[0, 1, 2, 3].map((row) => (
        <div key={row} className="h-16 animate-pulse rounded-card bg-sunken" />
      ))}
    </div>
  );
}

function UserPagination({
  page,
  pageSize,
  total,
  totalPages,
  onPrevious,
  onNext,
}: {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  onPrevious: () => void;
  onNext: () => void;
}) {
  const first = (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, total);
  const lastPage = Math.max(totalPages, 1);

  return (
    <nav
      aria-label="User pages"
      className="flex flex-col gap-3 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="text-sm text-ink-muted" aria-live="polite">
        Showing {first}–{last} of {total} {total === 1 ? "user" : "users"} · Page {page} of{" "}
        {lastPage}
      </p>
      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm" disabled={page <= 1} onClick={onPrevious}>
          Previous page
        </Button>
        <Button variant="secondary" size="sm" disabled={page >= lastPage} onClick={onNext}>
          Next page
        </Button>
      </div>
    </nav>
  );
}

export function UsersTable() {
  const currentUser = useCurrentUser();
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const users = useAsyncData(`admin-users:${page}`, (signal) => listUsers(page, signal));
  const [change, setChange] = useState<RoleChange | null>(null);
  const [saving, setSaving] = useState(false);
  const [changeError, setChangeError] = useState<string | null>(null);

  function closeDialog() {
    setChange(null);
    setChangeError(null);
  }

  async function confirmChange() {
    if (!change || saving) {
      return;
    }

    setSaving(true);
    setChangeError(null);

    try {
      const { user: updated } = await updateUserRole(change.user.id, change.role);
      users.setData((current) => ({
        ...current,
        users: current.users.map((user) => (user.id === updated.id ? updated : user)),
      }));
      toast({
        variant: "success",
        title: "Role updated",
        description: `${updated.email} is now ${updated.role}.`,
      });
      closeDialog();
    } catch (error) {
      if (isApiClientError(error) && error.status === 401) {
        redirectToLogin();
        return;
      }

      // The select never changed: it shows the stored role until the backend confirms.
      setChangeError(describeApiError(error));
    } finally {
      setSaving(false);
    }
  }

  if (users.status === "loading") {
    return <TableSkeleton />;
  }

  if (users.status === "error") {
    return (
      <ErrorState
        headingLevel="h2"
        title="The users could not be loaded"
        description={describeApiError(users.error)}
        onRetry={users.reload}
      />
    );
  }

  if (users.data.total === 0) {
    return <EmptyState title="No users yet" description="Registered users appear here." />;
  }

  return (
    <>
      <div
        aria-hidden="true"
        className="hidden grid-cols-[1fr_11rem_9rem] gap-4 px-4 pb-2 text-xs font-medium text-ink-muted md:grid"
      >
        <span>User</span>
        <span>Role</span>
        <span>Created</span>
      </div>
      <ul className="space-y-2">
        {users.data.users.map((user) => {
          const isSelf = user.id === currentUser.id;
          const selectId = `role-${user.id}`;

          return (
            <li
              key={user.id}
              className="grid gap-x-4 gap-y-3 rounded-card border border-line bg-surface p-4 md:grid-cols-[1fr_11rem_9rem] md:items-center md:py-3"
            >
              <div className="min-w-0">
                <p className="flex items-center gap-2 font-medium text-ink">
                  <span className="truncate">{user.name}</span>
                  {isSelf ? <Badge variant="primary">You</Badge> : null}
                </p>
                <p className="truncate text-sm text-ink-muted">{user.email}</p>
              </div>

              <div>
                <label htmlFor={selectId} className="sr-only">
                  Role for {user.email}
                </label>
                <Select
                  id={selectId}
                  value={user.role}
                  disabled={isSelf}
                  aria-describedby={isSelf ? `${selectId}-help` : undefined}
                  onChange={(event) => {
                    const role = roleSchema.parse(event.target.value);

                    if (role !== user.role) {
                      setChange({ user, role });
                    }
                  }}
                >
                  {roleSchema.options.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </Select>
                {isSelf ? (
                  <p id={`${selectId}-help`} className="mt-1 text-xs text-ink-muted">
                    You cannot change your own role.
                  </p>
                ) : null}
              </div>

              <p className="text-sm text-ink-muted">
                <span className="md:sr-only">Created: </span>
                <time dateTime={user.createdAt}>{formatDate(user.createdAt)}</time>
              </p>
            </li>
          );
        })}
      </ul>

      <UserPagination
        page={users.data.page}
        pageSize={users.data.pageSize}
        total={users.data.total}
        totalPages={users.data.totalPages}
        onPrevious={() => setPage((current) => Math.max(1, current - 1))}
        onNext={() => setPage((current) => current + 1)}
      />

      <Dialog
        open={change !== null}
        onOpenChange={(open) => {
          if (!open && !saving) {
            closeDialog();
          }
        }}
      >
        <DialogContent
          title={change ? `Change role to ${change.role}?` : "Change role?"}
          description={
            change
              ? `${change.user.email} will become ${change.role}. ${ROLE_EFFECT[change.role]}`
              : undefined
          }
        >
          {changeError ? (
            <DialogBody>
              <Alert variant="error" title="The role was not changed">
                {changeError}
              </Alert>
            </DialogBody>
          ) : null}
          <DialogFooter>
            <Button variant="secondary" disabled={saving} onClick={closeDialog}>
              Cancel
            </Button>
            <Button loading={saving} onClick={confirmChange}>
              {saving ? "Saving" : "Change role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
