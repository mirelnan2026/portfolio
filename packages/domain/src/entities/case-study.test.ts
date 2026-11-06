import { describe, expect, it } from "vitest";
import { caseStudySchema, type CaseStudy } from "./case-study";

const caseStudy = {
  slug: "example-migration",
  title: "Sequencing two upgrades",
  context: "Two risky upgrades were due.",
  approach: "Shipped them two weeks apart.",
  outcome: "Every regression was attributable.",
  whatItShows: "Risk management.",
  experienceSlug: "example-corp",
  phaseSlug: "first-product",
  url: null,
  skillSlugs: ["angular"],
  source: "interview-brief",
} satisfies CaseStudy;

describe("caseStudySchema", () => {
  it("accepts a valid case study", () => {
    expect(caseStudySchema.safeParse(caseStudy).success).toBe(true);
  });

  it("accepts a case study that is not tied to an experience", () => {
    const standalone = { ...caseStudy, experienceSlug: null, phaseSlug: null };
    expect(caseStudySchema.safeParse(standalone).success).toBe(true);
  });

  it("rejects a phase without its experience", () => {
    const result = caseStudySchema.safeParse({ ...caseStudy, experienceSlug: null });
    expect(result.error?.issues[0]?.path).toEqual(["phaseSlug"]);
  });

  it("rejects a link that is not https", () => {
    const result = caseStudySchema.safeParse({ ...caseStudy, url: "http://example.com" });
    expect(result.success).toBe(false);
  });
});
