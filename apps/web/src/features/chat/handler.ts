import type Anthropic from "@anthropic-ai/sdk";
import type { CvRepositories } from "@mirelnan/ai";
import { toYearMonth } from "@mirelnan/domain";
import { signAssistantTurn } from "../../server/chat-turn-signature";
import { parseChatRequest } from "./request";
import { runChatTurn } from "./turn";

/** The model the evaluations ran on: a change goes through a commit and the evaluations again. */
export const chatModel = "claude-haiku-5-5";

/** How long a signed answer stays usable in the conversation (ADR 0010). */
const answerTtlSeconds = 15 * 60;

const noStore = { "Cache-Control": "no-store" };

export interface ChatHandlerDeps {
  client: Anthropic;
  repos: CvRepositories;
  key: Buffer;
  now: () => Date;
  newConversationId: () => string;
}

/** One chat question over HTTP: the history is verified, the model answers, and the answer comes back signed. */
export async function handleChatRequest(
  request: Request,
  deps: ChatHandlerDeps,
): Promise<Response> {
  const parsed = await parseChatRequest(request, { key: deps.key, now: deps.now() });
  if (!parsed.ok) {
    return Response.json({ error: parsed.error }, { status: parsed.status, headers: noStore });
  }

  const started = deps.now();
  const turn = await runChatTurn({
    client: deps.client,
    model: chatModel,
    messages: parsed.messages,
    repos: deps.repos,
    now: toYearMonth(started),
    signal: request.signal,
  });
  const finished = deps.now();
  // What the loop did, for the server log: tools, request count and time, never the question, the answer or the IP.
  // eslint-disable-next-line no-console -- the one info line per turn the server keeps (ADR 0012)
  console.info(
    JSON.stringify({
      event: "chat_turn",
      ok: turn.ok,
      steps: turn.steps,
      tools: turn.tools,
      durationMs: finished.getTime() - started.getTime(),
    }),
  );
  if (!turn.ok) {
    return Response.json({ error: turn.error }, { status: 502, headers: noStore });
  }

  // Dated when it is ready, not when the request arrived: the tool rounds can take a minute or more.
  const answer = signAssistantTurn(
    {
      content: turn.answer,
      position: parsed.messages.length,
      conversationId: parsed.conversationId ?? deps.newConversationId(),
      tools: turn.tools,
    },
    deps.key,
    finished,
    answerTtlSeconds,
  );
  return Response.json({ answer }, { headers: noStore });
}
