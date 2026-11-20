import type { Metadata } from "next";
import { Container, PageHeader } from "@/components/layout";

export const metadata: Metadata = { title: "Chat" };

// Temporary page so the navigation has a destination. Replaced by its own feature.
export default function ChatPage() {
  return (
    <Container width="content" className="py-8">
      <PageHeader title="Chat" description="The chat interface is added in the next feature." />
    </Container>
  );
}
