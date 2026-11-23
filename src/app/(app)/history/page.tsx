import type { Metadata } from "next";
import Link from "next/link";
import { Container, PageHeader } from "@/components/layout";
import { buttonStyles } from "@/components/ui";
import { ConversationList } from "@/features/conversations/conversation-list";

export const metadata: Metadata = { title: "History" };

export default function HistoryPage() {
  return (
    <Container className="max-w-5xl space-y-6 py-8">
      <PageHeader
        title="History"
        description="Open a conversation to continue it, or delete the ones you no longer need."
        actions={
          <Link href="/chat" className={buttonStyles({})}>
            New conversation
          </Link>
        }
      />
      <ConversationList />
    </Container>
  );
}
