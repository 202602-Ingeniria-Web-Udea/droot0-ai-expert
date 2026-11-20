import type { Metadata } from "next";
import { ChatView } from "@/features/chat/chat-view";

export const metadata: Metadata = { title: "New conversation" };

export default function NewChatPage() {
  return <ChatView />;
}
