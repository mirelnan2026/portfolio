import { describe, expect, it } from "vitest";
import { durationLabel, tenureLabel, yearRange } from "./format";

describe("yearRange", () => {
  it.each([
    [{ start: "2023-03", end: "2024-12" }, "2023–2024"],
    [{ start: "2024-01", end: "2024-10" }, "2024"],
    [{ start: "2025-01", end: null }, "2025–present"],
  ] as const)("formats %j as %s", (period, expected) => {
    expect(yearRange(period)).toBe(expected);
  });
});

describe("durationLabel", () => {
  it("counts both the first and the last month, and counts an ongoing role up to now", () => {
    expect(durationLabel({ start: "2023-03", end: "2026-10" }, "2030-01")).toBe("3 years 8 months");
    expect(durationLabel({ start: "2026-06", end: null }, "2026-11")).toBe("6 months");
  });
});

describe("tenureLabel", () => {
  it.each([
    [123, "10+ yrs", "over 10 years"],
    [120, "10 yrs", "10 years"],
    [21, "1+ yr", "over 1 year"],
    [12, "1 yr", "1 year"],
    [8, "<1 yr", "under a year"],
  ])("labels %i months", (months, text, spoken) => {
    expect(tenureLabel(months)).toEqual({ text, spoken });
  });
});
