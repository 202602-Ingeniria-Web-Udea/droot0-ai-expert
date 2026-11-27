import { describe, expect, it } from "vitest";
import { conversationDetailFixture } from "@/lib/contracts/fixtures";
import {
  buildConversationJsonExport,
  buildConversationMarkdownExport,
  conversationExportFilename,
} from "@/lib/utils/conversation-export";

const exportedAt = new Date("2026-11-24T12:00:00.000Z");

describe("conversation export", () => {
  it("builds a readable Markdown export", () => {
    const markdown = buildConversationMarkdownExport(conversationDetailFixture, exportedAt);

    expect(markdown).toContain("# Explain JavaScript closures");
    expect(markdown).toContain("Exported from AI Expert Chat");
    expect(markdown).toContain("## You");
    expect(markdown).toContain("Can you explain JavaScript closures");
    expect(markdown).toContain("## AI Expert Chat");
    expect(markdown).toContain("A closure is a function");
  });

  it("builds a JSON export with conversation metadata and messages", () => {
    const payload = JSON.parse(buildConversationJsonExport(conversationDetailFixture, exportedAt));

    expect(payload.exportedAt).toBe(exportedAt.toISOString());
    expect(payload.conversation).toEqual(conversationDetailFixture.conversation);
    expect(payload.messages).toEqual(conversationDetailFixture.messages);
  });

  it("creates safe filenames", () => {
    expect(conversationExportFilename("Explain JavaScript closures", "markdown")).toBe(
      "explain-javascript-closures.md",
    );
    expect(conversationExportFilename("  Closures / Scope  ", "json")).toBe("closures-scope.json");
    expect(conversationExportFilename("***", "markdown")).toBe("conversation.md");
  });
});
