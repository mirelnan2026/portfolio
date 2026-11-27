import { createHmac, timingSafeEqual } from "node:crypto";
import { cvToolNames } from "@mirelnan/ai";
import { z } from "zod";

/** 256 bits, the minimum for an HMAC-SHA256 key. A shorter key is refused, never padded. */
export const signatureKeyMinBytes = 32;

const conversationIdSchema = z.uuid();

const knownTools: readonly string[] = cvToolNames;

/** The tools an answer was written from (ADR 0012): CV tool names only, each once. */
const toolsSchema = z
  .array(z.string().refine((name) => knownTools.includes(name)))
  .refine((tools) => new Set(tools).size === tools.length);

const signedAssistantTurnSchema = z.strictObject({
  role: z.literal("assistant"),
  conversationId: conversationIdSchema,
  content: z.string(),
  tools: toolsSchema,
  position: z.number().int().nonnegative(),
  issuedAt: z.iso.datetime(),
  expiresAt: z.iso.datetime(),
  // Exactly 64 lowercase hex characters: one accepted form per signature.
  signature: z.string().regex(/^[0-9a-f]{64}$/),
});

export type SignedAssistantTurn = z.infer<typeof signedAssistantTurnSchema>;

export interface ExpectedTurn {
  conversationId: string;
  position: number;
}

export type VerifyResult =
  | { valid: true }
  | { valid: false; reason: "malformed" | "signature" | "conversation" | "position" | "expired" };

function assertKey(key: Buffer): void {
  if (key.length < signatureKeyMinBytes) {
    throw new Error(`The chat signing key must be at least ${String(signatureKeyMinBytes)} bytes`);
  }
}

/**
 * What the signature covers. A JSON array has one unambiguous encoding: plain concatenation would
 * let "ab" + "c" and "a" + "bc" produce the same input.
 */
function digest(key: Buffer, fields: Omit<SignedAssistantTurn, "signature">): string {
  const payload = JSON.stringify([
    fields.role,
    fields.conversationId,
    fields.position,
    fields.content,
    fields.tools,
    fields.issuedAt,
    fields.expiresAt,
  ]);
  return createHmac("sha256", key).update(payload).digest("hex");
}

export function signAssistantTurn(
  input: { content: string; position: number; conversationId: string; tools: readonly string[] },
  key: Buffer,
  issuedAt: Date,
  ttlSeconds: number,
): SignedAssistantTurn {
  assertKey(key);
  if (!Number.isInteger(input.position) || input.position < 0) {
    throw new Error("The position of a chat turn must be a non-negative integer");
  }
  if (!conversationIdSchema.safeParse(input.conversationId).success) {
    throw new Error("The conversation id of a chat turn must be a UUID");
  }
  if (!toolsSchema.safeParse(input.tools).success) {
    throw new Error("The tools of a chat turn must be CV tool names, each once");
  }
  const fields: Omit<SignedAssistantTurn, "signature"> = {
    role: "assistant",
    conversationId: input.conversationId,
    content: input.content,
    tools: [...input.tools],
    position: input.position,
    issuedAt: issuedAt.toISOString(),
    expiresAt: new Date(issuedAt.getTime() + ttlSeconds * 1000).toISOString(),
  };
  return { ...fields, signature: digest(key, fields) };
}

export function verifyAssistantTurn(
  turn: unknown,
  expected: ExpectedTurn,
  key: Buffer,
  now: Date,
): VerifyResult {
  assertKey(key);
  const parsed = signedAssistantTurnSchema.safeParse(turn);
  if (!parsed.success) {
    return { valid: false, reason: "malformed" };
  }

  const { signature, ...fields } = parsed.data;
  const expectedMac = Buffer.from(digest(key, fields), "hex");
  const actualMac = Buffer.from(signature, "hex");
  // timingSafeEqual throws on different lengths; the schema already fixes the length, this is the guard.
  if (actualMac.length !== expectedMac.length || !timingSafeEqual(actualMac, expectedMac)) {
    return { valid: false, reason: "signature" };
  }
  if (fields.conversationId !== expected.conversationId) {
    return { valid: false, reason: "conversation" };
  }
  if (fields.position !== expected.position) {
    return { valid: false, reason: "position" };
  }
  if (now.getTime() >= Date.parse(fields.expiresAt)) {
    return { valid: false, reason: "expired" };
  }
  return { valid: true };
}
