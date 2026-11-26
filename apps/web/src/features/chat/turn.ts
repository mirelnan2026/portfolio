import type { ChatConversation, CvRepositories } from "@mirelnan/ai";
import { buildSystemPrompt, cvToolDefinitions, runCvTool } from "@mirelnan/ai";
import type Anthropic from "@anthropic-ai/sdk";

/** Enough for a question about the CV: a few tool calls, then the answer. */
const defaultMaxSteps = 4;
/** A chat answer that takes longer than this is abandoned, so a hung request cannot hold the server function. */
const modelTimeoutMs = 20_000;

const unavailable = "The assistant is unavailable right now. Please try again.";

export type TurnResult = { ok: true; answer: string } | { ok: false; error: string };

export interface TurnInput {
  client: Anthropic;
  model: string;
  messages: ChatConversation;
  repos: CvRepositories;
  now: string;
  maxSteps?: number;
}

function textOf(content: Anthropic.ContentBlock[]): string {
  return content.flatMap((block) => (block.type === "text" ? [block.text] : [])).join("");
}

/** Asks the model, runs the tools it requests, and repeats until it writes its answer or the turn must stop. */
export async function runChatTurn(input: TurnInput): Promise<TurnResult> {
  const maxSteps = input.maxSteps ?? defaultMaxSteps;
  const messages: Anthropic.MessageParam[] = input.messages.map((message) => ({
    role: message.role,
    content: message.content,
  }));

  try {
    for (let step = 0; step < maxSteps; step++) {
      const response = await input.client.messages.create(
        {
          model: input.model,
          max_tokens: 800,
          system: buildSystemPrompt(),
          // The definitions are plain JSON Schema; the SDK's type expects a stricter object shape.
          tools: cvToolDefinitions as unknown as Anthropic.Tool[],
          messages,
        },
        { timeout: modelTimeoutMs },
      );

      if (response.stop_reason === "refusal") {
        return { ok: false, error: "I can't answer that question." };
      }
      if (response.stop_reason === "max_tokens") {
        return { ok: false, error: "The answer was too long. Try a shorter question." };
      }

      const uses = response.content.filter(
        (block): block is Anthropic.ToolUseBlock => block.type === "tool_use",
      );
      if (uses.length === 0) {
        const answer = textOf(response.content).trim();
        // An empty answer is not an answer: showing it would leave the visitor with a blank reply.
        return answer === "" ? { ok: false, error: unavailable } : { ok: true, answer };
      }

      messages.push({ role: "assistant", content: response.content });
      const results: Anthropic.ToolResultBlockParam[] = [];
      for (const use of uses) {
        const result = await runCvTool(use.name, use.input, input.repos, input.now);
        results.push({
          type: "tool_result",
          tool_use_id: use.id,
          content: JSON.stringify(result),
          is_error: !result.ok,
        });
      }
      messages.push({ role: "user", content: results });
    }
    return { ok: false, error: "This question needs too many steps. Try a narrower one." };
  } catch (error) {
    // The visitor gets a generic line: the SDK's message can contain request details. The server log gets the cause.
    const cause = error instanceof Error ? error.message : String(error);
    console.error(`chat turn failed: ${cause}`, error);
    return { ok: false, error: unavailable };
  }
}
