import type Anthropic from "@anthropic-ai/sdk";
import type { ChatConversation, CvRepositories } from "@mirelnan/ai";
import { describe, expect, it, vi } from "vitest";
import { chatRequestSettings, runChatTurn } from "./turn";

// Fictitious: the tests use a fake model and a single workflow step, never the real API or database.
const repos = {
  workflow: {
    list: () =>
      Promise.resolve([
        {
          slug: "specify",
          title: "Specify",
          body: "I write the spec first.",
          sourceSlug: "employment-brief",
        },
      ]),
  },
} as unknown as CvRepositories;

const question: ChatConversation = [{ role: "user", content: "How do you work with AI tools?" }];

const text = (value: string) => ({ type: "text", text: value });
const toolUse = (id: string, name: string, input: unknown) => ({
  type: "tool_use",
  id,
  name,
  input,
});
const reply = (content: unknown[], stopReason = "end_turn") => ({
  content,
  stop_reason: stopReason,
  usage: { input_tokens: 100, output_tokens: 20 },
});

interface RecordedCall {
  system: string;
  tools: unknown[];
  messages: { role: string; content: unknown }[];
}

/** A model that answers with the given responses in order, and records every request and its options. */
function fakeModel(responses: (ReturnType<typeof reply> | Error)[]) {
  const calls: RecordedCall[] = [];
  const options: ({ timeout?: number; signal?: AbortSignal } | undefined)[] = [];
  let next = 0;
  const client = {
    messages: {
      create: (
        params: RecordedCall,
        requestOptions?: { timeout?: number; signal?: AbortSignal },
      ) => {
        calls.push(structuredClone(params));
        options.push(requestOptions);
        const response = responses[next++];
        if (response === undefined) {
          throw new Error("the fake model has no more responses");
        }
        return response instanceof Error ? Promise.reject(response) : Promise.resolve(response);
      },
    },
  } as unknown as Anthropic;
  return { client, calls, options };
}

const run = (client: Anthropic, maxSteps?: number, repository: CvRepositories = repos) =>
  runChatTurn({
    client,
    model: "claude-haiku-5-5",
    messages: question,
    repos: repository,
    now: "2026-11",
    ...(maxSteps === undefined ? {} : { maxSteps }),
  });

describe("runChatTurn", () => {
  it("returns the model's text when it answers without a tool", async () => {
    const { client, calls } = fakeModel([reply([text("Yes, I did.")])]);
    expect(await run(client)).toEqual({ ok: true, answer: "Yes, I did." });
    expect(calls).toHaveLength(1);
  });

  it("runs the tool the model asks for and sends its result back before the final answer", async () => {
    const { client, calls } = fakeModel([
      reply([toolUse("t1", "get_workflow", {})], "tool_use"),
      reply([text("I write the spec first.")]),
    ]);
    expect(await run(client)).toEqual({ ok: true, answer: "I write the spec first." });
    expect(calls).toHaveLength(2);
    expect(calls[1]?.messages.at(-1)).toMatchObject({
      role: "user",
      content: [{ type: "tool_result", tool_use_id: "t1" }],
    });
  });

  it("gives every call the system prompt and all the CV tools", async () => {
    const { client, calls } = fakeModel([reply([text("Hi.")])]);
    await run(client);
    expect(calls[0]?.system).toContain("not in the CV");
    expect(calls[0]?.tools).toHaveLength(8);
  });

  it("stops after the step limit, instead of looping with the tools", async () => {
    const looping = Array.from({ length: 5 }, (_, index) =>
      reply([toolUse(`t${String(index)}`, "get_workflow", {})], "tool_use"),
    );
    const { client, calls } = fakeModel(looping);
    const result = await run(client, 2);
    expect(result.ok).toBe(false);
    expect(calls).toHaveLength(2);
  });

  it("allows a question that needs five rounds of tools under the default limit", async () => {
    const rounds = Array.from({ length: 5 }, (_, index) =>
      reply([toolUse(`t${String(index)}`, "get_workflow", {})], "tool_use"),
    );
    const { client } = fakeModel([...rounds, reply([text("Here is how.")])]);
    expect(await run(client)).toEqual({ ok: true, answer: "Here is how." });
  });

  it("reports a refusal instead of showing it as an answer", async () => {
    const { client } = fakeModel([reply([text("I cannot help with that.")], "refusal")]);
    expect(await run(client)).toMatchObject({ ok: false });
  });

  it("reports an answer cut off by the token limit instead of showing half of it", async () => {
    const { client } = fakeModel([reply([text("Mirel worked on")], "max_tokens")]);
    expect(await run(client)).toMatchObject({ ok: false });
  });

  it("tells the model when its tool input was invalid, instead of hiding the failure", async () => {
    const { client, calls } = fakeModel([
      reply([toolUse("t1", "get_experience", { slug: "Not A Slug" })], "tool_use"),
      reply([text("I could not find that role.")]),
    ]);
    await run(client);
    expect(calls[1]?.messages.at(-1)).toMatchObject({
      content: [{ type: "tool_result", tool_use_id: "t1", is_error: true }],
    });
  });

  it("answers a failed model call with a generic message, without the technical details", async () => {
    const { client } = fakeModel([new Error("socket hang up, key sk-ant-not-a-real-key")]);
    const result = await run(client);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected a failure");
    expect(result.error).not.toContain("sk-ant");
    expect(result.error).not.toContain("socket");
  });
});

describe("runChatTurn, edge cases", () => {
  it("does not show an empty answer when the model wrote no text", async () => {
    const { client } = fakeModel([reply([])]);
    expect(await run(client)).toMatchObject({ ok: false });
  });

  it("gives back every tool result in one message when the model asks for several tools at once", async () => {
    const { client, calls } = fakeModel([
      reply([toolUse("a", "get_workflow", {}), toolUse("b", "get_workflow", {})], "tool_use"),
      reply([text("Done.")]),
    ]);
    await run(client);
    expect(calls[1]?.messages.at(-1)).toMatchObject({
      role: "user",
      content: [
        { type: "tool_result", tool_use_id: "a" },
        { type: "tool_result", tool_use_id: "b" },
      ],
    });
  });

  it("turns a tool name the model invented into an error for the model, not a crash", async () => {
    const { client, calls } = fakeModel([
      reply([toolUse("t1", "delete_everything", {})], "tool_use"),
      reply([text("I can only use the CV tools.")]),
    ]);
    const result = await run(client);
    expect(result).toEqual({ ok: true, answer: "I can only use the CV tools." });
    expect(calls[1]?.messages.at(-1)).toMatchObject({
      content: [{ type: "tool_result", tool_use_id: "t1", is_error: true }],
    });
  });

  it("does not put the error of a failing tool into the answer or the reply, only a generic line", async () => {
    const failing = {
      workflow: {
        list: () => Promise.reject(new Error("connect ECONNREFUSED db-internal-host:5432")),
      },
    } as unknown as CvRepositories;
    const { client } = fakeModel([reply([toolUse("t1", "get_workflow", {})], "tool_use")]);
    const result = await run(client, undefined, failing);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected a failure");
    expect(result.error).not.toContain("ECONNREFUSED");
    expect(result.error).not.toContain("db-internal-host");
  });

  it("writes the real error to the server log, so the cause is not lost when the visitor sees a generic line", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { client } = fakeModel([new Error("socket hang up")]);
    await run(client);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("socket hang up"), expect.anything());
    spy.mockRestore();
  });

  it("sets a timeout on every model call, so a hung request cannot hold the server", async () => {
    const { client, options } = fakeModel([reply([text("Hi.")])]);
    await run(client);
    const timeout = options[0]?.timeout;
    expect(timeout).toBeGreaterThan(0);
    expect(timeout).toBeLessThanOrEqual(30_000);
  });
});

describe("runChatTurn, a visitor who leaves", () => {
  const ask = (client: Anthropic, signal: AbortSignal) =>
    runChatTurn({
      client,
      model: "claude-haiku-5-5",
      messages: question,
      repos,
      now: "2026-11",
      signal,
    });

  it("gives the visitor's signal to every model call, so a closed tab cancels the request in flight", async () => {
    const controller = new AbortController();
    const { client, options } = fakeModel([
      reply([toolUse("t1", "get_workflow", {})], "tool_use"),
      reply([text("Hi.")]),
    ]);
    await ask(client, controller.signal);
    expect(options).toHaveLength(2);
    for (const option of options) {
      expect(option?.signal).toBe(controller.signal);
    }
  });

  it("asks the model nothing more once the visitor has left between two rounds", async () => {
    const controller = new AbortController();
    const { client, calls } = fakeModel([
      reply([toolUse("t1", "get_workflow", {})], "tool_use"),
      reply([text("never sent")]),
    ]);
    const answered = client.messages.create.bind(client.messages);
    // The visitor closes the tab while the first answer is on its way.
    vi.spyOn(client.messages, "create").mockImplementation((...args) => {
      const result = answered(...args);
      controller.abort();
      return result;
    });

    const result = await ask(client, controller.signal);
    expect(calls).toHaveLength(1);
    expect(result).toEqual({
      ok: false,
      error: "The assistant is unavailable right now. Please try again.",
    });
  });

  it("does not log a request the visitor cancelled while it was in flight as a server error", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const controller = new AbortController();
    // The SDK rejects the call in flight once its signal is aborted.
    const { client } = fakeModel([new Error("Request was aborted.")]);
    const rejected = client.messages.create.bind(client.messages);
    vi.spyOn(client.messages, "create").mockImplementation((...args) => {
      controller.abort();
      return rejected(...args);
    });

    const result = await ask(client, controller.signal);
    expect(result).toEqual({
      ok: false,
      error: "The assistant is unavailable right now. Please try again.",
    });
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});

describe("runChatTurn, the request settings", () => {
  it("asks every request with the shared settings, so the evaluations measure what production sends", async () => {
    const { client, calls } = fakeModel([
      reply([toolUse("t1", "get_workflow", {})], "tool_use"),
      reply([text("Hi.")]),
    ]);
    await run(client);
    for (const call of calls) {
      expect(call).toMatchObject(chatRequestSettings);
    }
  });

  it("leaves room for the model's thinking and the answer, at an effort that keeps the rules", () => {
    // Haiku 5.5 thinks by default and its thinking counts against max_tokens: at 800 an answer once came back empty.
    // Low effort fixed that but broke the English rule (a Romanian reply one time in ten), so the effort stays medium.
    expect(chatRequestSettings.output_config.effort).toBe("medium");
    expect(chatRequestSettings.max_tokens).toBeGreaterThanOrEqual(2_000);
  });
});
