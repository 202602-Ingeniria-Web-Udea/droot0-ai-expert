import type { Metadata } from "next";
import { StatsView } from "@/features/admin/stats-view";

export const metadata: Metadata = { title: "Statistics" };

export default function AdminStatsPage() {
  return (
    <section aria-labelledby="stats-heading" className="space-y-4">
      <h2 id="stats-heading" className="text-lg font-semibold tracking-tight text-ink">
        Statistics
      </h2>
      <StatsView />
    </section>
  );
}
