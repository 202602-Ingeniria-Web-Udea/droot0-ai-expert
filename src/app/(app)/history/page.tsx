import type { Metadata } from "next";
import { Container, PageHeader } from "@/components/layout";

export const metadata: Metadata = { title: "History" };

// Temporary page so the navigation has a destination. Replaced by its own feature.
export default function HistoryPage() {
  return (
    <Container width="content" className="py-8">
      <PageHeader
        title="History"
        description="The conversation history is added in a later feature."
      />
    </Container>
  );
}
