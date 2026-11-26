import { z } from "zod";
import { signatureKeyMinBytes } from "./chat-turn-signature";

const serverEnvSchema = z.object({
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
});

const rateLimitEnvSchema = z.object({
  UPSTASH_REDIS_REST_URL: z.url({ protocol: /^https$/ }),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1),
});

const anthropicEnvSchema = z.object({
  // Anthropic keys start with this prefix. A value without it, such as an OpenAI key pasted by mistake, is refused.
  ANTHROPIC_API_KEY: z.string().startsWith("sk-ant-"),
});

const chatSigningEnvSchema = z.object({
  // Random bytes in base64url without padding. The alphabet is checked first, because
  // Buffer.from(…, "base64url") silently skips characters outside it instead of failing.
  CHAT_SIGNING_KEY: z
    .string()
    .regex(/^[\w-]+$/)
    .transform((value) => Buffer.from(value, "base64url"))
    .refine((key) => key.length >= signatureKeyMinBytes),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;
export type RateLimitEnv = z.infer<typeof rateLimitEnvSchema>;
export type AnthropicEnv = z.infer<typeof anthropicEnvSchema>;
export type ChatSigningEnv = z.infer<typeof chatSigningEnvSchema>;

/**
 * Validates one group of variables. The error names the variables and where to set them, never their
 * values, so a secret cannot end up in a build or server log.
 */
function readEnv<Schema extends z.ZodType>(
  schema: Schema,
  env: Record<string, string | undefined>,
): z.output<Schema> {
  const result = schema.safeParse(env);
  if (!result.success) {
    const names = [...new Set(result.error.issues.map((issue) => issue.path.join(".")))];
    throw new Error(
      `Missing or invalid environment variables: ${names.join(", ")}. Copy apps/web/.env.example to ` +
        "apps/web/.env.local and fill it in (on Vercel: Project Settings → Environment Variables).",
    );
  }
  return result.data;
}

/** What the build and every page need: read when the composition root loads. */
export function readServerEnv(env: Record<string, string | undefined>): ServerEnv {
  return readEnv(serverEnvSchema, env);
}

/** What the rate limiter needs: read on the first request, so the build never needs these secrets. */
export function readRateLimitEnv(env: Record<string, string | undefined>): RateLimitEnv {
  return readEnv(rateLimitEnvSchema, env);
}

/** What the chat needs: read on the first request, so the build never needs the key. */
export function readAnthropicEnv(env: Record<string, string | undefined>): AnthropicEnv {
  return readEnv(anthropicEnvSchema, env);
}

/** The key that signs the chat's assistant turns: read on the first request, never at build. */
export function readChatSigningEnv(env: Record<string, string | undefined>): ChatSigningEnv {
  return readEnv(chatSigningEnvSchema, env);
}
