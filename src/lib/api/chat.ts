import { chatResponseSchema, type ChatRequest } from "@/lib/contracts/chat";
import { apiRequest } from "./client";

/**
 * Sends a message to the application backend, which calls the AI provider.
 * Omit `conversationId` (or pass null) to start a new conversation.
 *
 * The backend stores both messages only when the assistant answers, so a
 * failed request leaves nothing behind.
 */
export function sendMessage(input: ChatRequest) {
  return apiRequest("/api/chat", { method: "POST", body: input, schema: chatResponseSchema });
}
