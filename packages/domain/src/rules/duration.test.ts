import { describe, expect, it } from "vitest";
import { formatDuration, monthsBetween, toDuration } from "./duration";

describe("monthsBetween", () => {
  it("counts a single month as one month", () => {
    expect(monthsBetween("2026-03", "2026-03")).toBe(1);
  });

  it("counts both the first and the last month", () => {
    expect(monthsBetween("2023-03", "2026-10")).toBe(44);
  });

  it("crosses a year boundary", () => {
    expect(monthsBetween("2025-12", "2026-01")).toBe(2);
  });

  it("rejects a period that ends before it starts", () => {
    expect(() => monthsBetween("2026-10", "2026-09")).toThrow(RangeError);
  });

  it.each(["2026-13", "2026-1", "26-01", "2026-00", ""])(
    "rejects the invalid value %j",
    (value) => {
      expect(() => monthsBetween(value, "2026-01")).toThrow(RangeError);
    },
  );
});

describe("toDuration", () => {
  it.each([
    [44, { years: 3, months: 8 }],
    [12, { years: 1, months: 0 }],
    [5, { years: 0, months: 5 }],
  ])("splits %i months", (total, expected) => {
    expect(toDuration(total)).toEqual(expected);
  });
});

describe("formatDuration", () => {
  it.each([
    [{ years: 3, months: 8 }, "3 years 8 months"],
    [{ years: 1, months: 0 }, "1 year"],
    [{ years: 0, months: 1 }, "1 month"],
    [{ years: 2, months: 5 }, "2 years 5 months"],
  ])("formats %o as %j", (duration, expected) => {
    expect(formatDuration(duration)).toBe(expected);
  });
});
