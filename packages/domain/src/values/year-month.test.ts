import { describe, expect, it } from "vitest";
import { toMonthIndex, toYearMonth, yearMonthSchema } from "./year-month";

describe("yearMonthSchema", () => {
  it.each(["2023-03", "2026-12", "2009-10"])("accepts %j", (value) => {
    expect(yearMonthSchema.safeParse(value).success).toBe(true);
  });

  it.each(["2026-13", "2026-1", "26-01", "2026-00", "2026-03-01", ""])("rejects %j", (value) => {
    expect(yearMonthSchema.safeParse(value).success).toBe(false);
  });
});

describe("toMonthIndex", () => {
  it("puts consecutive months one apart, across a year boundary", () => {
    expect(toMonthIndex("2026-01") - toMonthIndex("2025-12")).toBe(1);
  });
});

describe("toYearMonth", () => {
  it("returns the UTC calendar month with two digits", () => {
    expect(toYearMonth(new Date(Date.UTC(2026, 2, 5)))).toBe("2026-03");
  });
});
