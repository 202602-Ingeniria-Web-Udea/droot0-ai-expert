import type { Metadata } from "next";
import { Container, PageHeader } from "@/components/layout";

export const metadata: Metadata = { title: "Administration" };

// Temporary page so the navigation has a destination. Replaced by its own feature.
export default function AdminPage() {
  return (
    <Container width="content" className="py-8">
      <PageHeader
        title="Administration"
        description="The administration pages are added in a later feature."
      />
    </Container>
  );
}
