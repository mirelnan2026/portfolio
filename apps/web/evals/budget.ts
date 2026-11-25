/** The models the evaluations compare. Prices are USD per million tokens, from the pricing page. */
export type EvalModel = "claude-haiku-5-5" | "claude-sonnet-5-5";

const pricePerMillion: Record<EvalModel, { input: number; output: number }> = {
  "claude-haiku-5-5": { input: 0.1, output: 0.5 },
  "claude-sonnet-5-5": { input: 2, output: 10 },
};

function isTokenCount(value: number): boolean {
  return Number.isInteger(value) && value >= 0;
}

/** The cost of one request, from the token counts the API returns. */
export function costOf(
  model: EvalModel,
  usage: { input_tokens: number; output_tokens: number },
): number {
  if (!Object.hasOwn(pricePerMillion, model)) {
    throw new Error(`There is no price for the model ${model}`);
  }
  if (!isTokenCount(usage.input_tokens) || !isTokenCount(usage.output_tokens)) {
    throw new Error("Token counts must be non-negative whole numbers");
  }
  const price = pricePerMillion[model];
  return (usage.input_tokens * price.input + usage.output_tokens * price.output) / 1_000_000;
}

/** Stops the evaluations before the spending limit is passed. */
export class BudgetGuard {
  private spent = 0;

  constructor(private readonly limitUsd: number) {
    if (!Number.isFinite(limitUsd) || limitUsd <= 0) {
      throw new Error("The budget limit must be a positive, finite number of dollars");
    }
  }

  add(usd: number): void {
    if (!Number.isFinite(usd) || usd < 0) {
      throw new Error("A cost must be a finite, non-negative number of dollars");
    }
    this.spent += usd;
  }

  get exhausted(): boolean {
    return this.spent >= this.limitUsd;
  }

  get total(): number {
    return this.spent;
  }
}
