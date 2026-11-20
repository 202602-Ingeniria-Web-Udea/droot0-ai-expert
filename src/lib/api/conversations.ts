import {
  conversationDetailResponseSchema,
  conversationListResponseSchema,
  deleteConversationResponseSchema,
  renameConversationResponseSchema,
} from "@/lib/contracts/conversations";
import { apiRequest } from "./client";

export function listConversations(signal?: AbortSignal) {
  return apiRequest("/api/conversations", { schema: conversationListResponseSchema, signal });
}

/** Rejects with NOT_FOUND when the conversation is missing or belongs to someone else. */
export function getConversation(id: string, signal?: AbortSignal) {
  return apiRequest(`/api/conversations/${encodeURIComponent(id)}`, {
    schema: conversationDetailResponseSchema,
    signal,
  });
}

export function renameConversation(id: string, title: string) {
  return apiRequest(`/api/conversations/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: { title },
    schema: renameConversationResponseSchema,
  });
}

export function deleteConversation(id: string) {
  return apiRequest(`/api/conversations/${encodeURIComponent(id)}`, {
    method: "DELETE",
    schema: deleteConversationResponseSchema,
  });
}
