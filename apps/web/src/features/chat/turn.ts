import type { ChatConversation, CvRepositories } from "@mirelnan/ai";
import { buildSystemPrompt, cvToolDefinitions, runCvTool, withoutSourcesTags } from "@mirelnan/ai";
import type Anthropic from "@anthropic-ai/sdk";

/**
 * Requests to the model per question. A question about a project with several parts needs five tool rounds and
 * then the answer (measured in the evaluations), so six leaves one round of margin.
 */
const defaultMaxSteps = 6;
/** A chat answer that takes longer than this is abandoned, so a hung request cannot hold the server function. */
const modelTimeoutMs = 20_000;

/**
 * What every chat request asks of the model, shared with the evaluations so they measure what production sends.
 * Haiku 5.5 thinks by default, and its thinking counts against max_tokens: at 800 tokens an answer once came back
 * empty. The limit leaves room for both. The effort is set, not left to the model's default: low effort was faster
 * but answered a Romanian question in Romanian one time in ten, so it stays medium.
 */
export const chatRequestSettings = {
  max_tokens: 2_000,
  output_config: { effort: "medium" },
} as const satisfies Partial<Anthropic.MessageCreateParamsNonStreaming>;

const unavailable = "The assistant is unavailable right now. Please try again.";

/** The turn's outcome, with the tools it called (each once, in order) and the requests it made, for the log. */
export type TurnResult = ({ ok: true; answer: string } | { ok: false; error: string }) & {
  tools: string[];
  steps: number;
};

export interface TurnInput {
  client: Anthropic;
  model: string;
  messages: ChatConversation;
  repos: CvRepositories;
  now: string;
  maxSteps?: number;
  /** Aborted when the visitor disconnects: the request in flight is cancelled and no new one starts. */
  signal?: AbortSignal;
}

function textOf(content: Anthropic.ContentBlock[]): string {
  return content.flatMap((block) => (block.type === "text" ? [block.text] : [])).join("");
}

/** Asks the model, runs the tools it requests, and repeats until it writes its answer or the turn must stop. */
export async function runChatTurn(input: TurnInput): Promise<TurnResult> {
  const tools: string[] = [];
  let steps = 0;
  const done = (
    result: { ok: true; answer: string } | { ok: false; error: string },
  ): TurnResult => ({
    ...result,
    tools,
    steps,
  });

  const maxSteps = input.maxSteps ?? defaultMaxSteps;
  const messages: Anthropic.MessageParam[] = input.messages.map((message) => ({
    role: message.role,
    content: message.content,
  }));

  try {
    for (let step = 0; step < maxSteps; step++) {
      // A visitor who left gets no answer: stop before paying for another round.
      if (input.signal?.aborted) {
        return done({ ok: false, error: unavailable });
      }
      steps++;
      const response = await input.client.messages.create(
        {
          model: input.model,
          ...chatRequestSettings,
          system: buildSystemPrompt(),
          // The definitions are plain JSON Schema; the SDK's type expects a stricter object shape.
          tools: cvToolDefinitions as unknown as Anthropic.Tool[],
          messages,
        },
        { timeout: modelTimeoutMs, signal: input.signal },
      );

      if (response.stop_reason === "refusal") {
        return done({ ok: false, error: "I can't answer that question." });
      }
      if (response.stop_reason === "max_tokens") {
        return done({ ok: false, error: "The answer was too long. Try a shorter question." });
      }

      const uses = response.content.filter(
        (block): block is Anthropic.ToolUseBlock => block.type === "tool_use",
      );
      if (uses.length === 0) {
        // Only the server writes a <sources> note (ADR 0012): a tag in the model's text is removed before signing.
        const answer = withoutSourcesTags(textOf(response.content));
        // An empty answer is not an answer: showing it would leave the visitor with a blank reply.
        return done(answer === "" ? { ok: false, error: unavailable } : { ok: true, answer });
      }

      messages.push({ role: "assistant", content: response.content });
      const results: Anthropic.ToolResultBlockParam[] = [];
      for (const use of uses) {
        const result = await runCvTool(use.name, use.input, input.repos, input.now);
        // Only a tool that returned data is evidence; an invented name or invalid input is not (ADR 0012).
        if (result.ok && !tools.includes(use.name)) {
          tools.push(use.name);
        }
        results.push({
          type: "tool_result",
          tool_use_id: use.id,
          content: JSON.stringify(result),
          is_error: !result.ok,
        });
      }
      messages.push({ role: "user", content: results });
    }
    return done({ ok: false, error: "This question needs too many steps. Try a narrower one." });
  } catch (error) {
    // A cancelled request is the visitor leaving, not a server fault: nothing to log.
    if (input.signal?.aborted) {
      return done({ ok: false, error: unavailable });
    }
    // The visitor gets a generic line: the SDK's message can contain request details. The server log gets the cause.
    const cause = error instanceof Error ? error.message : String(error);
    console.error(`chat turn failed: ${cause}`, error);
    return done({ ok: false, error: unavailable });
  }
}
