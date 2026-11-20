import { adminStatsFixture, adminUserFixture, authUserFixture } from "@/lib/contracts/fixtures";
import type { AdminStats } from "@/lib/contracts/admin";
import type { AuthUser } from "@/lib/contracts/auth";

/*
 * `adminUserFixture.id` in the shared fixtures is not a valid UUID (its
 * variant digit is "c"), so responses built from it fail `authUserSchema`.
 * These copies fix the id for frontend tests without editing the shared file.
 */
export const adminUser: AuthUser = {
  ...adminUserFixture,
  id: "9f555951-aed1-42e2-a356-6aaedf85abed",
};

export const regularUser: AuthUser = authUserFixture;

export const adminStats: AdminStats = {
  ...adminStatsFixture,
  recentUsers: [adminUser, regularUser],
};
