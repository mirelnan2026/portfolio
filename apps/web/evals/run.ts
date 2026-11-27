import { appendFile, mkdir } from "node:fs/promises";
import Anthropic from "@anthropic-ai/sdk";
import { buildSystemPrompt, cvToolDefinitions, runCvTool, withSourcesNote } from "@mirelnan/ai";
import {
  connectToPostgres,
  createDrizzleRepositories,
  type PostgresConnection,
} from "@mirelnan/db";
import type { Repositories } from "@mirelnan/domain";
import { BudgetGuard, costOf, type EvalModel } from "./budget";
import { selectCases } from "./cases";
import { type EvalCase, factHolds, grade, type ToolCall } from "./graders";
import { reportLine } from "./report";
import { chatRequestSettings } from "../src/features/chat/turn";

/** The owner's limit is $4; the guard stops at $3.50 so the last call cannot pass it. */
const budgetLimitUsd = 3.5;
/** Tool round trips allowed per question. */
const maxSteps = 6;
/** Where each run's answers are written, one JSON line per case. Git ignores this folder. */
const resultsDir = new URL("./results/", import.meta.url);

/** Why a question ended. Anything other than "end_turn" is a failure, whatever the answer says. */
type StopReason = "end_turn" | "budget" | "max_tokens" | "refusal" | "out_of_steps";

interface Outcome {
  answer: string;
  calls: ToolCall[];
  stopReason: StopReason;
  /** How many requests the model received for this question. */
  steps: number;
}

function argValue(name: string, fallback: string): string {
  const index = process.argv.indexOf(name);
  return index === -1 ? fallback : (process.argv[index + 1] ?? fallback);
}

function parseRepeats(raw: string): number {
  const repeats = Number(raw);
  if (!Number.isInteger(repeats) || repeats < 1) {
    throw new Error("--repeats must be a whole number, 1 or more");
  }
  return repeats;
}

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

function textOf(content: Anthropic.ContentBlock[]): string {
  return content.flatMap((block) => (block.type === "text" ? [block.text] : [])).join("");
}

/** One question, answered by the model with the tools, until it writes text, stops, or runs out of steps. */
async function askOnce(
  client: Anthropic,
  model: EvalModel,
  evalCase: EvalCase,
  repos: Repositories,
  budget: BudgetGuard,
): Promise<Outcome> {
  // Earlier turns come first, each answer with its tools note, exactly as the chat route builds them.
  const messages: Anthropic.MessageParam[] = [
    ...(evalCase.history ?? []).flatMap((turn): Anthropic.MessageParam[] => [
      { role: "user", content: turn.question },
      { role: "assistant", content: withSourcesNote(turn.answer, turn.tools) },
    ]),
    { role: "user", content: evalCase.question },
  ];
  const calls: ToolCall[] = [];
  let steps = 0;

  for (let step = 0; step < maxSteps; step++) {
    // Checked before every request, not only between cases, so one question cannot pass the limit.
    if (budget.exhausted) {
      return { answer: "", calls, stopReason: "budget", steps };
    }

    const response = await client.messages.create({
      model,
      // The same settings as the chat in production, so a change there is measured here.
      ...chatRequestSettings,
      system: buildSystemPrompt(),
      // The definitions are plain JSON Schema; the SDK's type expects a stricter object shape.
      tools: cvToolDefinitions as unknown as Anthropic.Tool[],
      messages,
    });
    budget.add(costOf(model, response.usage));
    steps++;
    messages.push({ role: "assistant", content: response.content });

    if (response.stop_reason === "max_tokens" || response.stop_reason === "refusal") {
      return { answer: textOf(response.content), calls, stopReason: response.stop_reason, steps };
    }

    const uses = response.content.filter(
      (block): block is Anthropic.ToolUseBlock => block.type === "tool_use",
    );
    if (uses.length === 0) {
      return { answer: textOf(response.content), calls, stopReason: "end_turn", steps };
    }

    const results: Anthropic.ToolResultBlockParam[] = [];
    for (const use of uses) {
      calls.push({ name: use.name, input: use.input });
      const result = await runCvTool(use.name, use.input, repos, currentMonth());
      results.push({
        type: "tool_result",
        tool_use_id: use.id,
        content: JSON.stringify(result),
        is_error: !result.ok,
      });
    }
    messages.push({ role: "user", content: results });
  }

  return { answer: "", calls, stopReason: "out_of_steps", steps };
}

/** The evaluations must read as the read-only role: a URL with the owner's role would be refused here. */
async function assertReaderRole(connection: PostgresConnection): Promise<void> {
  const { rows } = await connection.pool.query<{ current_user: string }>("select current_user");
  const role = rows[0]?.current_user;
  if (role !== "portfolio_reader") {
    throw new Error(`The evaluations must run as portfolio_reader, not as "${String(role)}"`);
  }
}

async function main(): Promise<void> {
  const model = argValue("--model", "");
  if (model !== "claude-haiku-5-5" && model !== "claude-sonnet-5-5") {
    throw new Error("Pass --model claude-haiku-5-5 or --model claude-sonnet-5-5");
  }
  const repeats = parseRepeats(argValue("--repeats", "3"));
  const cases = selectCases(argValue("--only", ""));
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is missing: use the read-only portfolio_reader URL in apps/web/.env.local",
    );
  }

  const connection = connectToPostgres(url);
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const resultsFile = new URL(`${model}-${stamp}.jsonl`, resultsDir);
  await mkdir(resultsDir, { recursive: true });

  const repos = createDrizzleRepositories(connection.db);
  const client = new Anthropic();
  const budget = new BudgetGuard(budgetLimitUsd);
  let passedCount = 0;
  let total = 0;
  // Planned questions for the progress counter; stale cases are skipped, so the run can end below this number.
  const planned = cases.length * repeats;
  const runStarted = Date.now();

  try {
    await assertReaderRole(connection);

    for (const evalCase of cases) {
      // A case that relies on the data is checked against the data first. When the fact no longer holds, the case
      // is stale: the data changed and the case must be updated. The model is not asked, and nothing is scored.
      if (evalCase.dataFact) {
        const outcome = await runCvTool(
          evalCase.dataFact.tool,
          evalCase.dataFact.input,
          repos,
          currentMonth(),
        );
        const check = factHolds(evalCase.dataFact, outcome);
        if (!check.holds) {
          process.stdout.write(`STALE ${model} ${evalCase.id} ${check.reason}\n`);
          await appendFile(
            resultsFile,
            `${JSON.stringify({ model, id: evalCase.id, stale: true, reason: check.reason })}\n`,
          );
          continue;
        }
      }

      for (let run = 1; run <= repeats; run++) {
        if (budget.exhausted) {
          process.stdout.write(`budget reached at $${budget.total.toFixed(2)}, stopping\n`);
          return;
        }
        total++;
        try {
          const startedAt = Date.now();
          const spentBefore = budget.total;
          const outcome = await askOnce(client, model, evalCase, repos, budget);
          const verdict = grade(evalCase, outcome.answer, outcome.calls);
          const failures =
            outcome.stopReason === "end_turn"
              ? verdict.failures
              : [`stopped: ${outcome.stopReason}`, ...verdict.failures];
          const passed = failures.length === 0;
          if (passed) passedCount++;

          process.stdout.write(
            reportLine({
              model,
              id: evalCase.id,
              run,
              passed,
              seconds: (Date.now() - startedAt) / 1000,
              costUsd: budget.total - spentBefore,
              progress: { done: total, planned },
              steps: outcome.steps,
              calls: outcome.calls,
              failures,
            }),
          );
          await appendFile(
            resultsFile,
            `${JSON.stringify({ model, id: evalCase.id, run, passed, failures, ...outcome })}\n`,
          );
        } catch (error) {
          // One failed request (network, rate limit) must not lose the results of the other cases.
          const message = error instanceof Error ? error.message : String(error);
          process.stdout.write(`ERROR ${model} ${evalCase.id} #${String(run)} ${message}\n`);
          await appendFile(
            resultsFile,
            `${JSON.stringify({ model, id: evalCase.id, run, error: message })}\n`,
          );
        }
      }
    }
  } finally {
    await connection.close();
    process.stdout.write(
      `\n${String(passedCount)}/${String(total)} passed on ${model}, spent $${budget.total.toFixed(4)} in ${((Date.now() - runStarted) / 1000).toFixed(1)}s\n` +
        `answers saved to ${resultsFile.pathname}\n`,
    );
  }
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
