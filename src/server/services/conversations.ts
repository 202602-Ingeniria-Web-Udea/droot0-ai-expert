import "server-only";
import type {
  Conversation,
  Message,
  MessageFeedback as MessageFeedbackRecord,
  Prisma,
} from "@prisma/client";
import type {
  ConversationSummary,
  FeedbackValue,
  Message as MessageDto,
  MessageFeedback as MessageFeedbackDto,
} from "@/lib/contracts/conversations";
import { prisma } from "@/server/db/prisma";
import { ApiError } from "@/server/http/api-error";

export type ConversationWithMessageCount = Conversation & {
  _count: {
    messages: number;
  };
};

const MESSAGE_DETAIL_LIMIT = 200;
const DEFAULT_CONVERSATION_LIMIT = 20;

function notFound(): never {
  throw new ApiError(404, "NOT_FOUND", "Conversation not found.");
}

function messageNotFound(): never {
  throw new ApiError(404, "NOT_FOUND", "Message not found.");
}

type MessageFeedbackFields = Pick<MessageFeedbackRecord, "value" | "createdAt" | "updatedAt">;

/** A message with the current user's feedback, if any. */
export type MessageWithFeedback = Message & {
  feedback?: MessageFeedbackFields[];
};

export function toFeedbackDto(feedback: MessageFeedbackFields): MessageFeedbackDto {
  return {
    value: feedback.value,
    createdAt: feedback.createdAt.toISOString(),
    updatedAt: feedback.updatedAt.toISOString(),
  };
}

export function toConversationSummary(
  conversation: ConversationWithMessageCount,
): ConversationSummary {
  return {
    id: conversation.id,
    title: conversation.title,
    createdAt: conversation.createdAt.toISOString(),
    updatedAt: conversation.updatedAt.toISOString(),
    messageCount: conversation._count.messages,
  };
}

export function toMessageDto(message: MessageWithFeedback): MessageDto {
  const feedback = message.feedback?.[0];

  return {
    id: message.id,
    role: message.role,
    content: message.content,
    createdAt: message.createdAt.toISOString(),
    feedback: feedback ? toFeedbackDto(feedback) : null,
  };
}

export async function listConversations(
  userId: string,
  limit = DEFAULT_CONVERSATION_LIMIT,
  search?: string,
): Promise<ConversationSummary[]> {
  const where: Prisma.ConversationWhereInput = { userId };

  if (search) {
    where.OR = [
      {
        title: {
          contains: search,
          mode: "insensitive",
        },
      },
      {
        messages: {
          some: {
            content: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
      },
    ];
  }

  const conversations = await prisma.conversation.findMany({
    where,
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    take: limit,
    include: {
      _count: {
        select: { messages: true },
      },
    },
  });

  return conversations.map(toConversationSummary);
}

export async function getOwnedConversation(
  userId: string,
  conversationId: string,
): Promise<ConversationWithMessageCount> {
  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      userId,
    },
    include: {
      _count: {
        select: { messages: true },
      },
    },
  });

  if (!conversation) {
    notFound();
  }

  return conversation;
}

export async function getConversationDetail(userId: string, conversationId: string) {
  const conversation = await getOwnedConversation(userId, conversationId);

  const messages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: MESSAGE_DETAIL_LIMIT,
    include: {
      feedback: {
        where: { userId },
        select: {
          value: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  });

  return {
    conversation: toConversationSummary(conversation),
    messages: messages.reverse().map(toMessageDto),
  };
}

export async function renameConversation(
  userId: string,
  conversationId: string,
  title: string,
): Promise<ConversationSummary> {
  const result = await prisma.conversation.updateMany({
    where: {
      id: conversationId,
      userId,
    },
    data: { title },
  });

  if (result.count === 0) {
    notFound();
  }

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      _count: {
        select: { messages: true },
      },
    },
  });

  if (!conversation) {
    notFound();
  }

  return toConversationSummary(conversation);
}

export async function deleteConversation(userId: string, conversationId: string): Promise<void> {
  const result = await prisma.conversation.deleteMany({
    where: {
      id: conversationId,
      userId,
    },
  });

  if (result.count === 0) {
    notFound();
  }
}

/**
 * Sets or removes the current user's feedback on one of their assistant
 * messages. Messages the user does not own, and user-authored messages, are
 * reported as not found so their existence is not leaked.
 */
export async function setMessageFeedback(
  userId: string,
  messageId: string,
  value: FeedbackValue | null,
): Promise<MessageFeedbackDto | null> {
  const message = await prisma.message.findFirst({
    where: {
      id: messageId,
      role: "ASSISTANT",
      conversation: { userId },
    },
    select: { id: true },
  });

  if (!message) {
    messageNotFound();
  }

  if (value === null) {
    await prisma.messageFeedback.deleteMany({
      where: { messageId, userId },
    });

    return null;
  }

  const feedback = await prisma.messageFeedback.upsert({
    where: {
      messageId_userId: { messageId, userId },
    },
    create: { messageId, userId, value },
    update: { value },
  });

  return toFeedbackDto(feedback);
}
