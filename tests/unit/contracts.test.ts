import { describe, expect, it } from "vitest";
import {
  adminUserListQuerySchema,
  updateAssistantConfigRequestSchema,
  updateUserRoleRequestSchema,
} from "@/lib/contracts/admin";
import { chatRequestSchema } from "@/lib/contracts/chat";
import {
  conversationListQuerySchema,
  messageSchema,
  setMessageFeedbackRequestSchema,
} from "@/lib/contracts/conversations";

describe("shared request contracts", () => {
  it("accepts a valid chat request", () => {
    const result = chatRequestSchema.safeParse({
      conversationId: null,
      content: "Explain closures.",
    });

    expect(result.success).toBe(true);
  });

  it("rejects empty chat content", () => {
    const result = chatRequestSchema.safeParse({
      content: "   ",
    });

    expect(result.success).toBe(false);
  });

  it("rejects invalid conversation IDs", () => {
    const result = chatRequestSchema.safeParse({
      conversationId: "not-a-uuid",
      content: "Hello",
    });

    expect(result.success).toBe(false);
  });

  it("validates role updates", () => {
    expect(updateUserRoleRequestSchema.safeParse({ role: "ADMIN" }).success).toBe(true);
    expect(updateUserRoleRequestSchema.safeParse({ role: "SUPERUSER" }).success).toBe(false);
  });

  it("validates admin user pagination parameters", () => {
    expect(adminUserListQuerySchema.parse({})).toEqual({ page: 1, pageSize: 20 });
    expect(adminUserListQuerySchema.parse({ page: "2", pageSize: "50" })).toEqual({
      page: 2,
      pageSize: 50,
    });
    expect(adminUserListQuerySchema.safeParse({ page: "0" }).success).toBe(false);
    expect(adminUserListQuerySchema.safeParse({ pageSize: "101" }).success).toBe(false);
  });

  it("validates assistant configuration limits", () => {
    expect(
      updateAssistantConfigRequestSchema.safeParse({
        name: "Programming Expert",
        systemPrompt: "You are a programming assistant.",
        model: "deepseek-chat",
        temperature: 0.3,
        maxTokens: 2048,
      }).success,
    ).toBe(true);

    expect(
      updateAssistantConfigRequestSchema.safeParse({
        name: "",
        systemPrompt: "",
        model: "",
        temperature: 3,
        maxTokens: 0,
      }).success,
    ).toBe(false);
  });

  it("coerces and validates the conversation list query", () => {
    expect(conversationListQuerySchema.parse({ limit: "25", q: "  closures  " })).toEqual({
      limit: 25,
      q: "closures",
    });
    expect(conversationListQuerySchema.safeParse({ limit: "101" }).success).toBe(false);
    expect(conversationListQuerySchema.safeParse({ q: "x".repeat(201) }).success).toBe(false);
  });

  it("validates feedback values and allows removal", () => {
    expect(setMessageFeedbackRequestSchema.parse({ value: "UP" })).toEqual({ value: "UP" });
    expect(setMessageFeedbackRequestSchema.parse({ value: "DOWN" })).toEqual({ value: "DOWN" });
    expect(setMessageFeedbackRequestSchema.parse({ value: null })).toEqual({ value: null });
    expect(setMessageFeedbackRequestSchema.safeParse({ value: "LOVE" }).success).toBe(false);
    expect(setMessageFeedbackRequestSchema.safeParse({}).success).toBe(false);
  });

  it("requires a nullable feedback field on messages", () => {
    const message = {
      id: "d5a3e4f6-7b8c-4d9e-af10-2b3c4d5e6f70",
      role: "ASSISTANT",
      content: "Answer",
      createdAt: "2026-11-06T09:06:00.000Z",
      feedback: null,
    };

    expect(messageSchema.safeParse(message).success).toBe(true);
    expect(messageSchema.safeParse({ ...message, feedback: undefined }).success).toBe(false);
    expect(
      messageSchema.safeParse({
        ...message,
        feedback: {
          value: "UP",
          createdAt: "2026-11-06T09:07:00.000Z",
          updatedAt: "2026-11-06T09:07:00.000Z",
        },
      }).success,
    ).toBe(true);
  });
});
