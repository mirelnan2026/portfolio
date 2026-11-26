import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { readAnthropicEnv } from "./env";

/**
 * The Claude client for the server. It is created on the first chat request, with the key read from the
 * environment. `server-only` stops client code from importing it, so the key never reaches the browser.
 */
export function createAnthropicClient(env: Record<string, string | undefined>): Anthropic {
  const { ANTHROPIC_API_KEY } = readAnthropicEnv(env);
  return new Anthropic({ apiKey: ANTHROPIC_API_KEY });
}
