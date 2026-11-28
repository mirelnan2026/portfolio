import {
  chatConversationSchema,
  chatLimits,
  withSourcesNote,
  type ChatConversation,
} from "@mirelnan/ai";
import { z } from "zod";
import { chatErrors } from "./messages";
import { type SignedAssistantTurn, verifyAssistantTurn } from "../../server/chat-turn-signature";

/** The most a chat request may weigh: a longest conversation is about 85 KB, plus the JSON around it. */
export const maxChatBodyBytes = 128 * 1024;

export type ChatRequestResult =
  | { ok: true; messages: ChatConversation; conversationId: string | null }
  | { ok: false; status: 400 | 413; error: string };

export interface ChatRequestOptions {
  key: Buffer;
  now: Date;
}

const invalid: ChatRequestResult = { ok: false, status: 400, error: "Invalid chat request." };

const bodySchema = z.strictObject({ messages: z.array(z.unknown()).max(64) });

// The visitor's question is validated on its own, so a refusal can say what is wrong with it.
const questionSchema = z.strictObject({
  role: z.literal("user"),
  content: z.string().trim().min(1).max(chatLimits.maxUserMessageLength),
});

/** Reads the body, but never more than the limit: a request without Content-Length is cut off while reading. */
async function readBody(request: Request): Promise<string | null> {
  const declared = request.headers.get("content-length");
  if (declared !== null && Number(declared) > maxChatBodyBytes) {
    return null;
  }
  if (request.body === null) {
    return "";
  }
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  let next = await reader.read();
  while (!next.done) {
    size += next.value.byteLength;
    if (size > maxChatBodyBytes) {
      await reader.cancel();
      return null;
    }
    chunks.push(next.value);
    next = await reader.read();
  }
  return new TextDecoder().decode(Buffer.concat(chunks));
}

/** The text, tools and conversation of an answer the server signed, or null when it does not check out. */
function verifiedAnswer(
  item: unknown,
  position: number,
  options: ChatRequestOptions,
): Pick<SignedAssistantTurn, "conversationId" | "content" | "tools"> | null {
  if (typeof item !== "object" || item === null || !("conversationId" in item)) {
    return null;
  }
  if (typeof item.conversationId !== "string") {
    return null;
  }
  // The answer names its own conversation; the signature proves the server issued it with that name and position.
  const check = verifyAssistantTurn(
    item,
    { conversationId: item.conversationId, position },
    options.key,
    options.now,
  );
  if (!check.valid) {
    return null;
  }
  // The check parsed the whole turn against its schema, so its fields have their types.
  const { conversationId, content, tools } = item as SignedAssistantTurn;
  return { conversationId, content, tools };
}

export async function parseChatRequest(
  request: Request,
  options: ChatRequestOptions,
): Promise<ChatRequestResult> {
  const text = await readBody(request);
  if (text === null) {
    return { ok: false, status: 413, error: "The chat request is too large." };
  }

  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return invalid;
  }
  const body = bodySchema.safeParse(json);
  if (!body.success) {
    return invalid;
  }

  const { messages } = body.data;
  if (messages.length === 0) {
    return invalid;
  }
  const verified = messages.map((item, position) => verifiedAnswer(item, position, options));
  // The conversation is the one of the last answer that checks out; answers of any other one are dropped.
  const currentId =
    [...verified].reverse().find((answer) => answer !== null)?.conversationId ?? null;

  const kept: unknown[] = [];
  for (const [index, item] of messages.entries()) {
    const role =
      typeof item === "object" && item !== null && "role" in item ? item.role : undefined;
    if (role === "user") {
      const question = questionSchema.safeParse(item);
      if (!question.success) {
        const tooLong = question.error.issues.some((issue) => issue.code === "too_big");
        return tooLong ? { ok: false, status: 400, error: "Your question is too long." } : invalid;
      }
      kept.push(question.data);
    } else if (role === "assistant") {
      const answer = verified[index];
      if (answer?.conversationId === currentId) {
        // The model sees the answer with the tools it came from, never the other signed fields.
        kept.push({ role: "assistant", content: withSourcesNote(answer.content, answer.tools) });
      }
    } else {
      return invalid;
    }
  }

  // A dropped answer can break the alternation of user and assistant messages: then the visitor starts again.
  const conversation = chatConversationSchema.safeParse(kept);
  if (!conversation.success) {
    return {
      ok: false,
      status: 400,
      error: chatErrors.conversationEnded,
    };
  }
  return { ok: true, messages: conversation.data, conversationId: currentId };
}
