import { chatLimits } from "@mirelnan/ai";
import { z } from "zod";
import { chatErrors } from "./messages";

/** The server's limit, so the browser never sends a question the route would refuse. */
export const maxQuestionLength = chatLimits.maxUserMessageLength;

/**
 * A signed answer. The browser reads only `content`; every other field goes back to the server untouched, so the
 * schema is loose: a field added later (the source chips) survives the round trip without a client change.
 */
const signedAnswerSchema = z.looseObject({
  role: z.literal("assistant"),
  content: z.string().min(1),
});
export type SignedAnswer = z.infer<typeof signedAnswerSchema>;

export type ChatEntry =
  { role: "user"; content: string } | { role: "assistant"; answer: SignedAnswer };

export type ChatReply =
  { ok: true; answer: SignedAnswer } | { ok: false; message: string; restart: boolean };

/** Longer than any line the route sends: anything longer did not come from us, so it is not shown. */
const maxErrorLength = 300;
const answerBodySchema = z.object({ answer: signedAnswerSchema });
const errorBodySchema = z.object({ error: z.string().min(1).max(maxErrorLength) });

const unavailable: ChatReply = { ok: false, message: chatErrors.unavailable, restart: false };

/** The request body: the history as the browser holds it, signed answers as they came, then the new question. */
export function chatRequestBody(entries: readonly ChatEntry[], question: string) {
  return {
    messages: [
      ...entries.map((entry) =>
        entry.role === "user" ? { role: "user", content: entry.content } : entry.answer,
      ),
      { role: "user", content: question.trim() },
    ],
  };
}

/** What the visitor sees for a response: the answer, the route's own generic line, or a fallback. */
export function readChatReply(status: number, body: unknown): ChatReply {
  if (status === 200) {
    const parsed = answerBodySchema.safeParse(body);
    return parsed.success ? { ok: true, answer: parsed.data.answer } : unavailable;
  }
  const parsed = errorBodySchema.safeParse(body);
  if (!parsed.success) {
    return unavailable;
  }
  const message = parsed.data.error;
  return { ok: false, message, restart: message === chatErrors.conversationEnded };
}

export function canAsk(question: string): boolean {
  const length = question.trim().length;
  return length > 0 && length <= maxQuestionLength;
}

/** The route takes at most `maxMessages`, ending with a question: one more must still fit. */
export function isConversationFull(entries: readonly ChatEntry[]): boolean {
  return entries.length + 1 > chatLimits.maxMessages;
}
