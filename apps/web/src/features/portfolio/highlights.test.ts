import type { Experience } from "@mirelnan/domain";
import { describe, expect, it } from "vitest";
import { highlightCards, yearRange } from "./highlights";

const experience = {
  slug: "example-corp",
  company: "Example Corp",
  role: "Frontend Engineer",
  employmentType: "contract",
  workMode: "remote",
  location: null,
  period: { start: "2022-03", end: "2024-10" },
  phases: [
    {
      slug: "second-product",
      title: "Second product",
      period: { start: "2024-01", end: "2024-10" },
      industrySlug: "example-industry",
      summary: "The second product.",
      sourceSlug: "cv",
    },
  ],
  highlights: [
    {
      body: "Built the first product.",
      ownership: "contributed",
      featured: { title: "First product", rank: 2 },
      phaseSlug: null,
      sourceSlug: "cv",
    },
    {
      body: "Fixed a bug.",
      ownership: "contributed",
      featured: null,
      phaseSlug: null,
      sourceSlug: "cv",
    },
    {
      body: "Owned the second product.",
      ownership: "owned",
      featured: { title: "Second product", rank: 1 },
      phaseSlug: "second-product",
      sourceSlug: "cv",
    },
  ],
  skills: [],
  products: [],
  sourceSlug: "cv",
} satisfies Experience;

describe("highlightCards", () => {
  it("keeps only featured highlights, in rank order, with the phase's years when there is a phase", () => {
    expect(highlightCards([experience])).toEqual([
      {
        title: "Second product",
        body: "Owned the second product.",
        owned: true,
        company: "Example Corp",
        years: "2024",
        experienceSlug: "example-corp",
      },
      {
        title: "First product",
        body: "Built the first product.",
        owned: false,
        company: "Example Corp",
        years: "2022–2024",
        experienceSlug: "example-corp",
      },
    ]);
  });
});

describe("yearRange", () => {
  it.each([
    [{ start: "2023-03", end: "2024-12" }, "2023–2024"],
    [{ start: "2024-01", end: "2024-10" }, "2024"],
    [{ start: "2025-01", end: null }, "2025–present"],
  ] as const)("formats %j as %s", (period, expected) => {
    expect(yearRange(period)).toBe(expected);
  });
});
