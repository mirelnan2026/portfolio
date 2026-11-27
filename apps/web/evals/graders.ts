/** One evaluation case: a question and what a good answer must, and must not, do. */
export interface EvalCase {
  id: string;
  question: string;
  /** Phrases the answer must contain, word for word. */
  mustContain?: string[];
  /** Patterns the answer must match: what it has to say, not only what it must not say. */
  mustMatch?: RegExp[];
  /** Patterns the answer must not match. */
  mustNotMatch?: RegExp[];
  /**
   * Earlier turns of the conversation, sent before the question as the chat route sends them: each answer with the
   * note of the tools it was written from (ADR 0012).
   */
  history?: { question: string; answer: string; tools: string[] }[];
  /** Tools that must have been called at least once. */
  mustCallTools?: string[];
  /** Terms that some search_cv call must have searched for (case-insensitive), so translation is checked. */
  mustSearchFor?: string[];
  /**
   * The fact about the CV data that the case relies on, e.g. "Kubernetes is not in the CV". The runner checks it
   * against the real data before asking the model; when it no longer holds, the case is stale, not failed.
   */
  dataFact?: DataFact;
}

/** A fact about the data, checked with one tool call and no model. */
export interface DataFact {
  tool: string;
  input: unknown;
  /** "no-hits": the tool returns an empty list. "hits": it returns at least one item. */
  expect: "no-hits" | "hits";
}

export interface FactCheck {
  holds: boolean;
  /** Why the fact holds or does not, in words, for the report. */
  reason: string;
}

/** The part of a tool result that a fact check needs: whether the tool ran, and what it returned. */
export interface ToolOutcome {
  ok: boolean;
  data?: unknown;
  error?: string;
}

/**
 * Decides from a tool result whether a data fact still holds. A failing tool does not hold: a broken tool must not
 * be read as "the data is empty", which would make every "not in the CV" case look correct.
 */
export function factHolds(fact: DataFact, outcome: ToolOutcome): FactCheck {
  const subject = `${fact.tool} ${JSON.stringify(fact.input)}`;
  if (!outcome.ok) {
    return { holds: false, reason: `${subject} failed: ${outcome.error ?? "unknown error"}` };
  }
  if (!Array.isArray(outcome.data)) {
    return { holds: false, reason: `${subject} did not return a list` };
  }
  const found = outcome.data.length;
  const holds = fact.expect === "no-hits" ? found === 0 : found > 0;
  const expectation = fact.expect === "no-hits" ? "no results" : "at least one result";
  return {
    holds,
    reason: holds
      ? `${subject}: ${expectation}, as the case expects`
      : `expected ${expectation} from ${subject}, found ${String(found)}`,
  };
}

/** One tool call the model made, with the input it sent. */
export interface ToolCall {
  name: string;
  input: unknown;
}

export interface Verdict {
  passed: boolean;
  /** Every failed check, in words; empty when the case passes. */
  failures: string[];
}

/**
 * Makes the answer comparable with what we wrote: typographic quotes become plain ones, and every run of whitespace,
 * including a non-breaking space, becomes one space. Case is kept, because a pattern may depend on it.
 */
function normalizeText(text: string): string {
  return text
    .replace(/[‘’‛′]/g, "'")
    .replace(/[“”„]/g, '"')
    .replace(/\s+/g, " ");
}

/** An empty phrase or term would match every answer, so it is a mistake in the case, reported as one. */
function requireText(value: string, what: string): string {
  const normalized = normalizeText(value).trim();
  if (normalized === "") {
    throw new Error(`An empty ${what} would match every answer: fix the case`);
  }
  return normalized;
}

/** Code-based grading: deterministic checks that need no model. Every check runs, so all failures are reported. */
export function grade(evalCase: EvalCase, answer: string, calls: ToolCall[]): Verdict {
  const failures: string[] = [];

  // Without text the other checks pass trivially (no forbidden pattern matches ""), so emptiness fails first.
  if (answer.trim() === "") {
    failures.push("empty answer");
  }

  const text = normalizeText(answer);

  for (const phrase of evalCase.mustContain ?? []) {
    // Letter case is ignored: a sentence that starts with "Not in the CV" says the same thing.
    if (!text.toLowerCase().includes(requireText(phrase, "phrase").toLowerCase())) {
      failures.push(`missing "${phrase}"`);
    }
  }

  for (const pattern of evalCase.mustMatch ?? []) {
    // search() for the same reason as below: the verdict must not depend on the order of earlier calls.
    if (text.search(pattern) === -1) {
      failures.push(`did not match ${String(pattern)}`);
    }
  }

  for (const pattern of evalCase.mustNotMatch ?? []) {
    // search() ignores the global flag's lastIndex, so the same answer always gets the same verdict.
    if (text.search(pattern) !== -1) {
      failures.push(`matched forbidden ${String(pattern)}`);
    }
  }

  for (const name of evalCase.mustCallTools ?? []) {
    if (!calls.some((call) => call.name === name)) {
      failures.push(`tool "${name}" was not called`);
    }
  }

  for (const term of evalCase.mustSearchFor ?? []) {
    const searched = calls.some(
      (call) =>
        call.name === "search_cv" &&
        queryOf(call.input).toLowerCase().includes(requireText(term, "search term").toLowerCase()),
    );
    if (!searched) {
      failures.push(`no search_cv call searched for "${term}"`);
    }
  }

  return { passed: failures.length === 0, failures };
}

function queryOf(input: unknown): string {
  if (
    typeof input === "object" &&
    input !== null &&
    "query" in input &&
    typeof input.query === "string"
  ) {
    return input.query;
  }
  return "";
}
