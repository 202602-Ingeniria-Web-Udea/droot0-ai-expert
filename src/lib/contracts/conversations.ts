import { z } from "zod";
import { isoDateTimeSchema, messageRoleSchema, uuidSchema } from "./common";

export const conversationTitleSchema = z.string().trim().min(1).max(120);
export const messageContentSchema = z.string().trim().min(1).max(8000);
export const storedMessageContentSchema = z.string().min(1).max(50000);

export const feedbackValueSchema = z.enum(["UP", "DOWN"]);
export type FeedbackValue = z.infer<typeof feedbackValueSchema>;

export const messageFeedbackSchema = z.object({
  value: feedbackValueSchema,
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});
export type MessageFeedback = z.infer<typeof messageFeedbackSchema>;

export const messageSchema = z.object({
  id: uuidSchema,
  role: messageRoleSchema,
  content: storedMessageContentSchema,
  createdAt: isoDateTimeSchema,
  /** The current user's feedback, or null when they have not rated the message. */
  feedback: messageFeedbackSchema.nullable(),
});
export type Message = z.infer<typeof messageSchema>;

export const conversationSummarySchema = z.object({
  id: uuidSchema,
  title: z.string().min(1).max(120),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
  messageCount: z.number().int().nonnegative(),
});
export type ConversationSummary = z.infer<typeof conversationSummarySchema>;

export const conversationListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
  q: z.string().trim().min(1).max(200).optional(),
});
export type ConversationListQuery = z.infer<typeof conversationListQuerySchema>;

export const conversationListResponseSchema = z.object({
  conversations: z.array(conversationSummarySchema),
});
export type ConversationListResponse = z.infer<typeof conversationListResponseSchema>;

export const conversationDetailResponseSchema = z.object({
  conversation: conversationSummarySchema,
  messages: z.array(messageSchema),
});
export type ConversationDetailResponse = z.infer<typeof conversationDetailResponseSchema>;

export const renameConversationRequestSchema = z.object({
  title: conversationTitleSchema,
});
export type RenameConversationRequest = z.infer<typeof renameConversationRequestSchema>;

export const renameConversationResponseSchema = z.object({
  conversation: conversationSummarySchema,
});
export type RenameConversationResponse = z.infer<typeof renameConversationResponseSchema>;

export const deleteConversationResponseSchema = z.object({
  success: z.literal(true),
});
export type DeleteConversationResponse = z.infer<typeof deleteConversationResponseSchema>;

export const setMessageFeedbackRequestSchema = z.object({
  /** null removes the current user's feedback. */
  value: feedbackValueSchema.nullable(),
});
export type SetMessageFeedbackRequest = z.infer<typeof setMessageFeedbackRequestSchema>;

export const setMessageFeedbackResponseSchema = z.object({
  feedback: messageFeedbackSchema.nullable(),
});
export type SetMessageFeedbackResponse = z.infer<typeof setMessageFeedbackResponseSchema>;
