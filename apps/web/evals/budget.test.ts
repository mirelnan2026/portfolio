import { describe, expect, it } from "vitest";
import { BudgetGuard, costOf, type EvalModel } from "./budget";

describe("costOf", () => {
  it("prices Haiku 5.5 at $0.10 input and $0.50 output per million tokens", () => {
    const cost = costOf("claude-haiku-5-5", { input_tokens: 1_000_000, output_tokens: 1_000_000 });
    expect(cost).toBeCloseTo(0.6, 6);
  });

  it("prices Sonnet 5.5 at $2 input and $10 output per million tokens", () => {
    const cost = costOf("claude-sonnet-5-5", { input_tokens: 1_000_000, output_tokens: 1_000_000 });
    expect(cost).toBeCloseTo(12, 6);
  });

  it("costs nothing for a request with no tokens", () => {
    expect(costOf("claude-sonnet-5-5", { input_tokens: 0, output_tokens: 0 })).toBe(0);
  });

  it.each([
    ["negative input tokens", { input_tokens: -1, output_tokens: 0 }],
    ["fractional output tokens", { input_tokens: 0, output_tokens: 1.5 }],
    ["NaN input tokens", { input_tokens: Number.NaN, output_tokens: 0 }],
  ])("refuses %s, which would give a wrong cost", (_case, usage) => {
    expect(() => costOf("claude-haiku-5-5", usage)).toThrow();
  });

  it("refuses a model it has no price for, with a clear message", () => {
    expect(() =>
      costOf("claude-unknown" as EvalModel, { input_tokens: 1, output_tokens: 1 }),
    ).toThrow(/no price/i);
  });
});

describe("BudgetGuard", () => {
  it("is not exhausted below the limit", () => {
    const guard = new BudgetGuard(4);
    guard.add(3.9);
    expect(guard.exhausted).toBe(false);
  });

  it("is exhausted at the limit, so no further call is made", () => {
    const guard = new BudgetGuard(4);
    guard.add(4);
    expect(guard.exhausted).toBe(true);
  });

  it("refuses a negative amount, which would hide spending", () => {
    const guard = new BudgetGuard(4);
    expect(() => {
      guard.add(-1);
    }).toThrow();
  });

  it.each([Number.NaN, Number.POSITIVE_INFINITY])(
    "refuses a cost of %s: it would make the guard never stop",
    (usd) => {
      const guard = new BudgetGuard(4);
      expect(() => {
        guard.add(usd);
      }).toThrow();
      expect(guard.exhausted).toBe(false);
    },
  );

  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])("refuses a limit of %s", (limit) => {
    expect(() => new BudgetGuard(limit)).toThrow();
  });

  it("adds a zero cost without changing the total", () => {
    const guard = new BudgetGuard(4);
    guard.add(0);
    expect(guard.total).toBe(0);
  });
});
