"use client";

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ErrorState,
} from "@/components/ui";
import { getStats } from "@/lib/api/admin";
import { describeApiError } from "@/lib/api/errors";
import { useAsyncData } from "@/lib/api/use-async-data";
import type { AdminStats } from "@/lib/contracts/admin";
import { formatDate, formatDateTime, formatNumber } from "@/lib/utils/format";

/*
 * Every number and row on this screen comes from GET /api/admin/stats.
 * Nothing is computed from sample data, and there are no fallback values:
 * when the endpoint fails, the screen says the statistics are unavailable.
 */

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent>
        <p className="text-sm font-medium text-ink-muted">{label}</p>
        <p className="mt-1 text-3xl font-bold tracking-tight text-ink tabular-nums">
          {formatNumber(value)}
        </p>
      </CardContent>
    </Card>
  );
}

function RoleBreakdown({ usersByRole }: { usersByRole: AdminStats["usersByRole"] }) {
  const total = usersByRole.USER + usersByRole.ADMIN;
  const roles = [
    { role: "USER", count: usersByRole.USER },
    { role: "ADMIN", count: usersByRole.ADMIN },
  ] as const;

  return (
    <Card>
      <CardHeader>
        <CardTitle as="h3">Users by role</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="space-y-4">
          {roles.map(({ role, count }) => (
            <div key={role}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <dt className="font-medium text-ink">{role}</dt>
                <dd className="text-ink-muted tabular-nums">{formatNumber(count)}</dd>
              </div>
              <div aria-hidden="true" className="mt-1.5 h-2 overflow-hidden rounded-full bg-sunken">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: total === 0 ? "0%" : `${(count / total) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}

function RecentConversations({ items }: { items: AdminStats["recentConversations"] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle as="h3">Recent conversations</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-ink-muted">No conversations have been started yet.</p>
        ) : (
          <ul className="divide-y divide-line">
            {items.map((conversation) => (
              <li key={conversation.id} className="py-3 first:pt-0 last:pb-0">
                <p className="truncate text-sm font-medium text-ink">{conversation.title}</p>
                <p className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-ink-muted">
                  <span className="truncate">{conversation.userEmail}</span>
                  <time dateTime={conversation.updatedAt}>
                    {formatDateTime(conversation.updatedAt)}
                  </time>
                </p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function RecentUsers({ items }: { items: AdminStats["recentUsers"] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle as="h3">Recent users</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-ink-muted">No users have registered yet.</p>
        ) : (
          <ul className="divide-y divide-line">
            {items.map((user) => (
              <li
                key={user.id}
                className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">{user.name}</p>
                  <p className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-ink-muted">
                    <span className="truncate">{user.email}</span>
                    <span>
                      Joined <time dateTime={user.createdAt}>{formatDate(user.createdAt)}</time>
                    </span>
                  </p>
                </div>
                <Badge variant={user.role === "ADMIN" ? "primary" : "neutral"}>{user.role}</Badge>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export function StatsView() {
  const stats = useAsyncData("admin-stats", (signal) => getStats(signal));

  if (stats.status === "loading") {
    return (
      <div role="status" className="space-y-4">
        <span className="sr-only">Loading statistics</span>
        <div className="grid gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((card) => (
            <div key={card} className="h-24 animate-pulse rounded-card bg-sunken" />
          ))}
        </div>
        <div className="h-56 animate-pulse rounded-card bg-sunken" />
      </div>
    );
  }

  if (stats.status === "error") {
    return (
      <ErrorState
        headingLevel="h3"
        title="Statistics are unavailable"
        description={describeApiError(stats.error)}
        onRetry={stats.reload}
      />
    );
  }

  const data = stats.data.stats;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="secondary" size="sm" onClick={stats.reload}>
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total users" value={data.totalUsers} />
        <StatCard label="Total conversations" value={data.totalConversations} />
        <StatCard label="Total messages" value={data.totalMessages} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <RecentConversations items={data.recentConversations} />
        <div className="space-y-4">
          <RoleBreakdown usersByRole={data.usersByRole} />
          <RecentUsers items={data.recentUsers} />
        </div>
      </div>
    </div>
  );
}
