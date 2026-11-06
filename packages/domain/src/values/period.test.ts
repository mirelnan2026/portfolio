import { describe, expect, it } from "vitest";
import { isWithin, periodSchema, type Period } from "./period";

describe("periodSchema", () => {
  it.each([
    { start: "2023-03", end: "2026-10" },
    { start: "2023-03", end: "2023-03" },
    { start: "2023-03", end: null },
  ])("accepts %j", (period) => {
    expect(periodSchema.safeParse(period).success).toBe(true);
  });

  it("rejects a period that ends before it starts", () => {
    const result = periodSchema.safeParse({ start: "2026-10", end: "2023-03" });
    expect(result.error?.issues[0]?.path).toEqual(["end"]);
  });

  it("reports a malformed month as a validation error instead of throwing", () => {
    expect(periodSchema.safeParse({ start: "2026-13", end: "2026-12" }).success).toBe(false);
  });
});

describe("isWithin", () => {
  const outer: Period = { start: "2023-03", end: "2026-10" };

  it.each<[string, Period, boolean]>([
    ["inside", { start: "2024-01", end: "2024-12" }, true],
    ["on the same bounds", { start: "2023-03", end: "2026-10" }, true],
    ["starting before", { start: "2023-02", end: "2024-12" }, false],
    ["ending after", { start: "2024-01", end: "2026-11" }, false],
    ["ongoing inside a closed period", { start: "2024-01", end: null }, false],
  ])("%s → %s", (_case, inner, expected) => {
    expect(isWithin(inner, outer)).toBe(expected);
  });

  it("accepts any later end inside an ongoing period", () => {
    expect(isWithin({ start: "2024-01", end: "2030-01" }, { start: "2023-03", end: null })).toBe(
      true,
    );
  });
});
