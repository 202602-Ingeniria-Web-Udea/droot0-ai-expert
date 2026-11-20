import type { Metadata } from "next";
import { ChatView } from "@/features/chat/chat-view";

export const metadata: Metadata = { title: "Conversation" };

type ConversationPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ConversationPage({ params }: ConversationPageProps) {
  const { id } = await params;

  return <ChatView conversationId={id} />;
}
