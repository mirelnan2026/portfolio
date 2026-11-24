import { z } from "zod";

/**
 * Caps that bound what one chat request can cost. They are checked before any model call.
 */
export const chatLimits = {
  /** Odd, so a conversation always ends with the visitor's question: user, assistant, …, user. */
  maxMessages: 19,
  maxUserMessageLength: 1_000,
  maxAssistantMessageLength: 8_000,
} as const;

const userMessageSchema = z.strictObject({
  role: z.literal("user"),
  content: z.string().trim().min(1).max(chatLimits.maxUserMessageLength),
});

const assistantMessageSchema = z.strictObject({
  role: z.literal("assistant"),
  content: z.string().trim().min(1).max(chatLimits.maxAssistantMessageLength),
});

const chatMessageSchema = z.discriminatedUnion("role", [userMessageSchema, assistantMessageSchema]);

/**
 * The conversation a visitor sends, oldest first. The browser can send anything, so it is untrusted:
 * a conversation over a cap is rejected, not trimmed.
 */
export const chatConversationSchema = z
  .array(chatMessageSchema)
  .min(1)
  .max(chatLimits.maxMessages)
  .refine(
    (messages) =>
      messages.length % 2 === 1 &&
      messages.every((message, index) => message.role === (index % 2 === 0 ? "user" : "assistant")),
    {
      message: "Messages must alternate, starting and ending with the visitor's question",
      when: (payload) => payload.issues.length === 0,
    },
  );

export type ChatMessage = z.infer<typeof chatMessageSchema>;
export type ChatConversation = z.infer<typeof chatConversationSchema>;
