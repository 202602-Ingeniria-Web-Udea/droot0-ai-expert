import type { Metadata } from "next";
import { AssistantForm } from "@/features/admin/assistant-form";

export const metadata: Metadata = { title: "Assistant" };

export default function AdminAssistantPage() {
  return (
    <section aria-labelledby="assistant-heading" className="space-y-4">
      <h2 id="assistant-heading" className="text-lg font-semibold tracking-tight text-ink">
        Assistant configuration
      </h2>
      <AssistantForm />
    </section>
  );
}
