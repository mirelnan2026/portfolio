import type { Experience } from "@mirelnan/domain";
import { describe, expect, it } from "vitest";
import { durationLabel, employmentLine, yearRange } from "./format";

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

describe("employmentLine", () => {
  const role = {
    company: "Example Corp",
    employmentType: "full-time",
    workMode: "hybrid",
    location: "Bucharest, Romania",
  } as Experience;

  it("names the place only when the role is not remote", () => {
    expect(employmentLine(role)).toBe("Example Corp · Full-time · Hybrid · Bucharest, Romania");
    expect(
      employmentLine({ ...role, employmentType: "contract", workMode: "remote", location: null }),
    ).toBe("Example Corp · Contract · Remote");
    expect(
      employmentLine({ ...role, employmentType: "freelance", workMode: null, location: "Romania" }),
    ).toBe("Example Corp · Freelance · Romania");
  });
});
