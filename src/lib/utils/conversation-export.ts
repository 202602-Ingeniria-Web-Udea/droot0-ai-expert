import type { ConversationDetailResponse } from "@/lib/contracts/conversations";
import { formatDateTime } from "./format";

export type ConversationExportFormat = "markdown" | "json";

function exportDate(date: Date) {
  return formatDateTime(date.toISOString());
}

export function buildConversationMarkdownExport(
  detail: ConversationDetailResponse,
  exportedAt = new Date(),
): string {
  const lines = [
    `# ${detail.conversation.title}`,
    "",
    `Exported from AI Expert Chat on ${exportDate(exportedAt)}.`,
    "",
  ];

  for (const message of detail.messages) {
    const author = message.role === "USER" ? "You" : "AI Expert Chat";
    lines.push("---", "", `## ${author}`, "", `_${formatDateTime(message.createdAt)}_`, "");
    lines.push(message.content.trim(), "");
  }

  return `${lines.join("\n").trimEnd()}\n`;
}

export function buildConversationJsonExport(
  detail: ConversationDetailResponse,
  exportedAt = new Date(),
): string {
  return JSON.stringify(
    {
      exportedAt: exportedAt.toISOString(),
      conversation: detail.conversation,
      messages: detail.messages,
    },
    null,
    2,
  );
}

export function conversationExportFilename(
  title: string,
  format: ConversationExportFormat,
): string {
  const base =
    title
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "conversation";

  return `${base}.${format === "markdown" ? "md" : "json"}`;
}

export function downloadConversationExport(
  detail: ConversationDetailResponse,
  format: ConversationExportFormat,
): void {
  const isMarkdown = format === "markdown";
  const content = isMarkdown
    ? buildConversationMarkdownExport(detail)
    : buildConversationJsonExport(detail);
  const blob = new Blob([content], {
    type: isMarkdown ? "text/markdown;charset=utf-8" : "application/json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = conversationExportFilename(detail.conversation.title, format);
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
