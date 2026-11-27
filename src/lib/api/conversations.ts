import {
  conversationDetailResponseSchema,
  conversationListResponseSchema,
  deleteConversationResponseSchema,
  renameConversationResponseSchema,
  setMessageFeedbackResponseSchema,
  type FeedbackValue,
} from "@/lib/contracts/conversations";
import { apiRequest } from "./client";

export function listConversations(query?: string, signal?: AbortSignal) {
  const searchParams = new URLSearchParams();
  const trimmed = query?.trim();

  if (trimmed) {
    searchParams.set("q", trimmed);
  }

  const suffix = searchParams.toString();
  return apiRequest(`/api/conversations${suffix ? `?${suffix}` : ""}`, {
    schema: conversationListResponseSchema,
    signal,
  });
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

/** Rates an assistant message, or removes the rating when `value` is null. */
export function setMessageFeedback(id: string, value: FeedbackValue | null) {
  return apiRequest(`/api/messages/${encodeURIComponent(id)}/feedback`, {
    method: "PUT",
    body: { value },
    schema: setMessageFeedbackResponseSchema,
  });
}
