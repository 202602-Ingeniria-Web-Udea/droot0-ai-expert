import {
  adminStatsResponseSchema,
  adminUserListResponseSchema,
  assistantConfigResponseSchema,
  updateUserRoleResponseSchema,
  type AssistantConfigInput,
} from "@/lib/contracts/admin";
import type { Role } from "@/lib/contracts/common";
import { apiRequest } from "./client";

/*
 * Administration endpoints. The backend checks the ADMIN role on every one of
 * them; a non-admin session receives 403 FORBIDDEN regardless of what the
 * interface shows.
 */

export function listUsers(signal?: AbortSignal) {
  return apiRequest("/api/admin/users", { schema: adminUserListResponseSchema, signal });
}

export function updateUserRole(userId: string, role: Role) {
  return apiRequest(`/api/admin/users/${encodeURIComponent(userId)}/role`, {
    method: "PATCH",
    body: { role },
    schema: updateUserRoleResponseSchema,
  });
}

export function getAssistantConfig(signal?: AbortSignal) {
  return apiRequest("/api/admin/assistant", { schema: assistantConfigResponseSchema, signal });
}

export function updateAssistantConfig(input: AssistantConfigInput) {
  return apiRequest("/api/admin/assistant", {
    method: "PUT",
    body: input,
    schema: assistantConfigResponseSchema,
  });
}

export function getStats(signal?: AbortSignal) {
  return apiRequest("/api/admin/stats", { schema: adminStatsResponseSchema, signal });
}
