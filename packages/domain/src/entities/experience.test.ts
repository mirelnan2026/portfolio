import { describe, expect, it } from "vitest";
import { experienceSchema, type Experience } from "./experience";

const experience = {
  slug: "example-corp",
  company: "Example Corp",
  role: "Frontend Engineer",
  employmentType: "contract",
  workMode: "remote",
  location: null,
  period: { start: "2023-03", end: "2026-10" },
  phases: [
    {
      slug: "first-product",
      title: "First product",
      period: { start: "2023-03", end: "2024-12" },
      industrySlug: "video-tech",
      summary: "Built reporting screens.",
      source: "interview-brief",
    },
  ],
  highlights: [
    {
      body: "Led the frontend of a new product.",
      ownership: "owned",
      featured: { title: "New product build-out" },
      phaseSlug: "first-product",
      source: "cv",
    },
  ],
  skills: [{ skillSlug: "angular", phaseSlug: null, contextNote: null, source: "cv" }],
  products: [{ productSlug: "example-dashboard", phaseSlug: "first-product" }],
  source: "cv",
} satisfies Experience;

function issuePaths(input: unknown) {
  return experienceSchema.safeParse(input).error?.issues.map((issue) => issue.path) ?? [];
}

describe("experienceSchema", () => {
  it("accepts a valid experience", () => {
    expect(experienceSchema.safeParse(experience).success).toBe(true);
  });

  it("accepts an experience without phases", () => {
    const withoutPhases = { ...experience, phases: [], highlights: [], products: [] };
    expect(experienceSchema.safeParse(withoutPhases).success).toBe(true);
  });

  it("rejects unknown keys", () => {
    expect(experienceSchema.safeParse({ ...experience, salary: 1 }).success).toBe(false);
  });

  it("rejects an ownership other than owned or contributed", () => {
    const highlights = [{ ...experience.highlights[0], ownership: "led" }];
    expect(experienceSchema.safeParse({ ...experience, highlights }).success).toBe(false);
  });

  it("rejects a phase outside the experience period", () => {
    const phases = [{ ...experience.phases[0], period: { start: "2022-01", end: "2023-06" } }];
    expect(issuePaths({ ...experience, phases })).toEqual([["phases", 0, "period"]]);
  });

  it("reports a malformed phase month as a validation error instead of throwing", () => {
    const phases = [{ ...experience.phases[0], period: { start: "2024-13", end: null } }];
    expect(issuePaths({ ...experience, phases })).toEqual([["phases", 0, "period", "start"]]);
  });

  it("rejects duplicate phase slugs", () => {
    const phases = [experience.phases[0], experience.phases[0]];
    expect(issuePaths({ ...experience, phases })).toEqual([["phases", 1, "slug"]]);
  });

  it.each(["highlights", "skills", "products"] as const)(
    "rejects %s that point to an unknown phase",
    (list) => {
      const items = [{ ...experience[list][0], phaseSlug: "missing-phase" }];
      expect(issuePaths({ ...experience, [list]: items })).toEqual([[list, 0, "phaseSlug"]]);
    },
  );
});
