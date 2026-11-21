import type { ConversationDetailResponse } from "@/lib/contracts/conversations";

/*
 * Hand-off between the "new conversation" screen and the conversation page.
 *
 * The first message of a conversation is answered on /chat. The response
 * already contains the conversation and both messages, so it is kept here for
 * the navigation to /chat/<id>, which then renders without loading it again.
 * Each entry is read once and removed.
 */
const primed = new Map<string, ConversationDetailResponse>();

export function primeConversation(detail: ConversationDetailResponse) {
  primed.set(detail.conversation.id, detail);
}

export function takePrimedConversation(id: string) {
  const detail = primed.get(id);
  primed.delete(id);
  return detail;
}
