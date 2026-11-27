import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  makeConversationWithCount,
  makeMessage,
  makeMessageFeedback,
  testIds,
} from "../../helpers/factories";

const mocks = vi.hoisted(() => ({
  conversation: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    updateMany: vi.fn(),
    deleteMany: vi.fn(),
  },
  message: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
  },
  messageFeedback: {
    upsert: vi.fn(),
    deleteMany: vi.fn(),
  },
}));

vi.mock("@/server/db/prisma", () => ({
  prisma: {
    conversation: mocks.conversation,
    message: mocks.message,
    messageFeedback: mocks.messageFeedback,
  },
}));

import {
  deleteConversation,
  getConversationDetail,
  listConversations,
  renameConversation,
  setMessageFeedback,
} from "@/server/services/conversations";

describe("conversation service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("maps owned conversations to summaries", async () => {
    const older = makeConversationWithCount({
      id: "11111111-1111-4111-8111-111111111111",
      title: "Older",
    });
    const newer = makeConversationWithCount({
      id: "22222222-2222-4222-8222-222222222222",
      title: "Newer",
      _count: { messages: 4 },
    });

    mocks.conversation.findMany.mockResolvedValue([newer, older]);

    const result = await listConversations(testIds.user, 10);

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      id: newer.id,
      title: "Newer",
      messageCount: 4,
    });
    expect(result[0]?.createdAt).toBe(newer.createdAt.toISOString());
    expect(mocks.conversation.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: testIds.user },
        take: 10,
      }),
    );
  });

  it("searches owned conversations by title or message content", async () => {
    mocks.conversation.findMany.mockResolvedValue([]);

    await listConversations(testIds.user, 10, "closures");

    expect(mocks.conversation.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId: testIds.user,
          OR: [
            {
              title: {
                contains: "closures",
                mode: "insensitive",
              },
            },
            {
              messages: {
                some: {
                  content: {
                    contains: "closures",
                    mode: "insensitive",
                  },
                },
              },
            },
          ],
        },
      }),
    );
  });

  it("returns 404 when the conversation is not owned", async () => {
    mocks.conversation.findFirst.mockResolvedValue(null);

    await expect(getConversationDetail(testIds.user, testIds.conversation)).rejects.toMatchObject({
      status: 404,
      code: "NOT_FOUND",
    });
    expect(mocks.conversation.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: testIds.conversation,
          userId: testIds.user,
        },
      }),
    );
  });

  it("returns messages in chronological order", async () => {
    const conversation = makeConversationWithCount();
    const userMessage = makeMessage({
      id: "33333333-3333-4333-8333-333333333333",
      role: "USER",
      content: "First",
      createdAt: new Date("2026-11-08T10:00:00.000Z"),
    });
    const assistantMessage = makeMessage({
      id: "44444444-4444-4444-8444-444444444444",
      role: "ASSISTANT",
      content: "Second",
      createdAt: new Date("2026-11-08T10:01:00.000Z"),
    });

    mocks.conversation.findFirst.mockResolvedValue(conversation);
    mocks.message.findMany.mockResolvedValue([assistantMessage, userMessage]);

    const result = await getConversationDetail(testIds.user, testIds.conversation);

    expect(result.messages.map((message) => message.content)).toEqual(["First", "Second"]);
    expect(mocks.message.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { conversationId: testIds.conversation },
        take: 200,
      }),
    );
  });

  it("includes the current user's feedback in message details", async () => {
    const conversation = makeConversationWithCount();
    const assistantMessage = makeMessage({
      role: "ASSISTANT",
      content: "Rated answer",
    });
    const feedback = makeMessageFeedback({
      messageId: assistantMessage.id,
      value: "DOWN",
      createdAt: new Date("2026-11-08T11:00:00.000Z"),
      updatedAt: new Date("2026-11-08T11:05:00.000Z"),
    });

    mocks.conversation.findFirst.mockResolvedValue(conversation);
    mocks.message.findMany.mockResolvedValue([{ ...assistantMessage, feedback: [feedback] }]);

    const result = await getConversationDetail(testIds.user, testIds.conversation);

    expect(mocks.message.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        include: {
          feedback: {
            where: { userId: testIds.user },
            select: {
              value: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
      }),
    );
    expect(result.messages[0]?.feedback).toEqual({
      value: "DOWN",
      createdAt: "2026-11-08T11:00:00.000Z",
      updatedAt: "2026-11-08T11:05:00.000Z",
    });
  });

  it("sets feedback only for an owned assistant message", async () => {
    const message = makeMessage({ role: "ASSISTANT" });
    const feedback = makeMessageFeedback({ messageId: message.id, value: "UP" });

    mocks.message.findFirst.mockResolvedValue({ id: message.id });
    mocks.messageFeedback.upsert.mockResolvedValue(feedback);

    const result = await setMessageFeedback(testIds.user, message.id, "UP");

    expect(mocks.message.findFirst).toHaveBeenCalledWith({
      where: {
        id: message.id,
        role: "ASSISTANT",
        conversation: { userId: testIds.user },
      },
      select: { id: true },
    });
    expect(mocks.messageFeedback.upsert).toHaveBeenCalledWith({
      where: {
        messageId_userId: { messageId: message.id, userId: testIds.user },
      },
      create: { messageId: message.id, userId: testIds.user, value: "UP" },
      update: { value: "UP" },
    });
    expect(result).toEqual({
      value: "UP",
      createdAt: feedback.createdAt.toISOString(),
      updatedAt: feedback.updatedAt.toISOString(),
    });
  });

  it("removes feedback when the value is null", async () => {
    const message = makeMessage({ role: "ASSISTANT" });

    mocks.message.findFirst.mockResolvedValue({ id: message.id });
    mocks.messageFeedback.deleteMany.mockResolvedValue({ count: 1 });

    await expect(setMessageFeedback(testIds.user, message.id, null)).resolves.toBeNull();
    expect(mocks.messageFeedback.deleteMany).toHaveBeenCalledWith({
      where: { messageId: message.id, userId: testIds.user },
    });
    expect(mocks.messageFeedback.upsert).not.toHaveBeenCalled();
  });

  it("returns 404 for messages the user cannot rate", async () => {
    mocks.message.findFirst.mockResolvedValue(null);

    await expect(setMessageFeedback(testIds.user, testIds.message, "UP")).rejects.toMatchObject({
      status: 404,
      code: "NOT_FOUND",
    });
    expect(mocks.messageFeedback.upsert).not.toHaveBeenCalled();
    expect(mocks.messageFeedback.deleteMany).not.toHaveBeenCalled();
  });

  it("returns 404 when renaming an unowned conversation", async () => {
    mocks.conversation.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      renameConversation(testIds.user, testIds.conversation, "Renamed"),
    ).rejects.toMatchObject({
      status: 404,
      code: "NOT_FOUND",
    });
  });

  it("renames an owned conversation", async () => {
    const updated = makeConversationWithCount({ title: "Renamed" });

    mocks.conversation.updateMany.mockResolvedValue({ count: 1 });
    mocks.conversation.findUnique.mockResolvedValue(updated);

    const result = await renameConversation(testIds.user, testIds.conversation, "Renamed");

    expect(result.title).toBe("Renamed");
    expect(mocks.conversation.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: testIds.conversation,
          userId: testIds.user,
        },
        data: { title: "Renamed" },
      }),
    );
  });

  it("returns 404 when deleting an unowned conversation", async () => {
    mocks.conversation.deleteMany.mockResolvedValue({ count: 0 });

    await expect(deleteConversation(testIds.user, testIds.conversation)).rejects.toMatchObject({
      status: 404,
      code: "NOT_FOUND",
    });
  });

  it("deletes an owned conversation", async () => {
    mocks.conversation.deleteMany.mockResolvedValue({ count: 1 });

    await expect(deleteConversation(testIds.user, testIds.conversation)).resolves.toBeUndefined();
    expect(mocks.conversation.deleteMany).toHaveBeenCalledWith({
      where: {
        id: testIds.conversation,
        userId: testIds.user,
      },
    });
  });
});
