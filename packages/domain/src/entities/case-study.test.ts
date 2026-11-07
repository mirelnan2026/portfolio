import { describe, expect, it } from "vitest";
import { caseStudySchema, type CaseStudy } from "./case-study";

const caseStudy = {
  slug: "example-migration",
  title: "Sequencing two upgrades",
  context: "Two risky upgrades were due.",
  approach: "Shipped them two weeks apart.",
  outcome: "Every regression was attributable.",
  whatItShows: "Risk management.",
  about: { kind: "experience", experienceSlug: "example-corp", phaseSlug: "first-product" },
  url: null,
  skillSlugs: ["angular"],
  sourceSlug: "example-brief",
} satisfies CaseStudy;

describe("caseStudySchema", () => {
  it("accepts a valid case study", () => {
    expect(caseStudySchema.safeParse(caseStudy).success).toBe(true);
  });

  it("accepts a case study about a project", () => {
    const about = { kind: "project", projectSlug: "example-app" };
    expect(caseStudySchema.safeParse({ ...caseStudy, about }).success).toBe(true);
  });

  it("rejects a subject that is both an experience and a project", () => {
    const about = { ...caseStudy.about, projectSlug: "example-app" };
    expect(caseStudySchema.safeParse({ ...caseStudy, about }).success).toBe(false);
  });

  it("rejects a phase on a project", () => {
    const about = { kind: "project", projectSlug: "example-app", phaseSlug: "first-product" };
    expect(caseStudySchema.safeParse({ ...caseStudy, about }).success).toBe(false);
  });

  it("rejects a link that is not https", () => {
    const result = caseStudySchema.safeParse({ ...caseStudy, url: "http://example.com" });
    expect(result.success).toBe(false);
  });
});
