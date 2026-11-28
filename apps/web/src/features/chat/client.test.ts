import { chatLimits } from "@mirelnan/ai";
import { describe, expect, it } from "vitest";
import {
  canAsk,
  chatRequestBody,
  isConversationFull,
  maxQuestionLength,
  readChatReply,
  type ChatEntry,
  type SignedAnswer,
} from "./client";
import { chatErrors } from "./messages";

/** A signed answer as the route returns it. The browser never reads the signed fields: it sends them back as is. */
const answer: SignedAnswer = {
  role: "assistant",
  conversationId: "3f1c2d4e-5a6b-4c7d-8e9f-0a1b2c3d4e5f",
  content: "Mirel worked at JWP Connatix from March 2023 to October 2026.",
  tools: ["list_experiences"],
  position: 1,
  issuedAt: "2026-11-26T10:00:00.000Z",
  expiresAt: "2026-11-26T10:15:00.000Z",
  signature: "a".repeat(64),
};

describe("chatRequestBody", () => {
  it("sends a first question alone", () => {
    expect(chatRequestBody([], "Where does Mirel work?")).toEqual({
      messages: [{ role: "user", content: "Where does Mirel work?" }],
    });
  });

  it("sends earlier answers back exactly as the server signed them, then the new question", () => {
    const entries: ChatEntry[] = [
      { role: "user", content: "Where does Mirel work?" },
      { role: "assistant", answer },
    ];
    expect(chatRequestBody(entries, "Since when?")).toEqual({
      messages: [
        { role: "user", content: "Where does Mirel work?" },
        answer,
        { role: "user", content: "Since when?" },
      ],
    });
  });

  it("trims the question, as the server does", () => {
    expect(chatRequestBody([], "  Angular?  ").messages).toEqual([
      { role: "user", content: "Angular?" },
    ]);
  });
});

describe("readChatReply", () => {
  it("keeps a signed answer whole, with every field the server will check", () => {
    expect(readChatReply(200, { answer })).toEqual({ ok: true, answer });
  });

  it("keeps a field it does not know, so a new signed field still comes back to the server", () => {
    const withExtra = { ...answer, sources: ["jwp-connatix"] };
    expect(readChatReply(200, { answer: withExtra })).toEqual({ ok: true, answer: withExtra });
  });

  it.each([
    ["no answer", {}],
    ["an answer that is not the assistant's", { answer: { ...answer, role: "user" } }],
    ["an answer without text", { answer: { ...answer, content: "" } }],
    ["a body that is not an object", "Mirel worked at JWP Connatix."],
  ])("treats a 200 with %s as the chat being unavailable", (_case, body) => {
    expect(readChatReply(200, body)).toEqual({
      ok: false,
      message: chatErrors.unavailable,
      restart: false,
    });
  });

  it.each([
    [429, "Too many requests. Try again later."],
    [503, "The service is unavailable right now. Try again later."],
    [502, "This question needs too many steps. Try a narrower one."],
    [400, "Your question is too long."],
  ])(
    "shows the server's own line for a %i: the route only ever sends generic text",
    (status, error) => {
      expect(readChatReply(status, { error })).toEqual({
        ok: false,
        message: error,
        restart: false,
      });
    },
  );

  it("asks for a new conversation when the server says this one can no longer continue", () => {
    expect(readChatReply(400, { error: chatErrors.conversationEnded })).toEqual({
      ok: false,
      message: chatErrors.conversationEnded,
      restart: true,
    });
  });

  it.each([
    ["no error line", 500, {}],
    ["an error that is not text", 502, { error: { code: 1 } }],
    ["an error line too long to be one of ours", 400, { error: "x".repeat(301) }],
    ["a body that is not JSON", 504, undefined],
  ])("falls back to a generic line for %s", (_case, status, body) => {
    expect(readChatReply(status, body)).toEqual({
      ok: false,
      message: chatErrors.unavailable,
      restart: false,
    });
  });
});

describe("canAsk", () => {
  it("uses the server's limit, so the browser never sends a question the server would refuse", () => {
    expect(maxQuestionLength).toBe(chatLimits.maxUserMessageLength);
  });

  it.each([
    ["a question", "Angular?", true],
    ["an empty field", "", false],
    ["only spaces", "   \n ", false],
    ["a question of exactly the limit", "a".repeat(chatLimits.maxUserMessageLength), true],
    ["a question over the limit", "a".repeat(chatLimits.maxUserMessageLength + 1), false],
    [
      "spaces around a question at the limit",
      ` ${"a".repeat(chatLimits.maxUserMessageLength)} `,
      true,
    ],
  ])("accepts %s: %s", (_case, question, expected) => {
    expect(canAsk(question)).toBe(expected);
  });
});

describe("isConversationFull", () => {
  const exchange = (count: number): ChatEntry[] =>
    Array.from({ length: count }, (): ChatEntry[] => [
      { role: "user", content: "Question?" },
      { role: "assistant", answer },
    ]).flat();

  it("leaves room for a question while the history plus it fits the server's cap", () => {
    // 9 exchanges = 18 messages; with the next question, 19: the cap.
    expect(isConversationFull(exchange(9))).toBe(false);
  });

  it("is full when one more question would pass the cap", () => {
    expect(isConversationFull(exchange(10))).toBe(true);
  });

  it("is not full at the start", () => {
    expect(isConversationFull([])).toBe(false);
  });
});
