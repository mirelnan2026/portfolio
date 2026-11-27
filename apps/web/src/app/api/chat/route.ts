import { randomUUID } from "node:crypto";
import type Anthropic from "@anthropic-ai/sdk";
import type { CvRepositories } from "@mirelnan/ai";
import { handleChatRequest } from "@/features/chat/handler";
import { createAnthropicClient } from "@/server/anthropic";
import { repositories } from "@/server/container";
import { readChatSigningEnv } from "@/server/env";
import { createRateLimit } from "@/server/rate-limit";

// At most six model requests of 20 s each, plus the tools: past this the platform stops the function.
export const maxDuration = 150;

// The chat costs money, so it refuses when the limiter cannot answer in time.
const chatPolicy = { timeout: 2_000, onTimeout: "deny" } as const;
const perMinute = createRateLimit({
  name: "chat-minute",
  requests: 5,
  window: "1 m",
  ...chatPolicy,
});
const perDay = createRateLimit({ name: "chat-day", requests: 30, window: "24 h", ...chatPolicy });

// Only the ports the CV tools read: the products never reach the AI layer.
const { profile, experiences, projects, skills, caseStudies, workflow } = repositories;
const cvRepositories: CvRepositories = {
  profile,
  experiences,
  projects,
  skills,
  caseStudies,
  workflow,
};

// Created on the first request, so the build never needs the Anthropic key or the signing key.
let client: Anthropic | undefined;
let key: Buffer | undefined;

export async function POST(request: Request): Promise<Response> {
  const limited = (await perMinute(request)) ?? (await perDay(request));
  if (limited) return limited;

  client ??= createAnthropicClient(process.env);
  key ??= readChatSigningEnv(process.env).CHAT_SIGNING_KEY;

  return handleChatRequest(request, {
    client,
    repos: cvRepositories,
    key,
    now: () => new Date(),
    newConversationId: randomUUID,
  });
}
