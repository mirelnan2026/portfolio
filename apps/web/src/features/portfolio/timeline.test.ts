import type { Experience } from "@mirelnan/domain";
import { describe, expect, it } from "vitest";
import { cardSkills, splitByAge } from "./timeline";

const role = (slug: string, end: string | null) =>
  ({ slug, period: { start: "2010-01", end } }) as Experience;

describe("splitByAge", () => {
  it("groups the roles that ended more than ten years ago", () => {
    const { recent, earlier } = splitByAge(
      [role("now", null), role("recent", "2017-12"), role("old", "2016-07")],
      "2026-11",
    );
    expect(recent.map((item) => item.slug)).toEqual(["now", "recent"]);
    expect(earlier.map((item) => item.slug)).toEqual(["old"]);
  });
});

describe("cardSkills", () => {
  it("keeps the CV's and the brief's skills, not the skills matrix rows", () => {
    const experience = {
      skills: [
        { skillSlug: "angular", phaseSlug: null, contextNote: null, sourceSlug: "cv" },
        { skillSlug: "react", phaseSlug: null, contextNote: "On Preact.", sourceSlug: "jwx-brief" },
        { skillSlug: "jira", phaseSlug: null, contextNote: null, sourceSlug: "skills-matrix" },
      ],
    } as Experience;
    expect(cardSkills(experience).map((usage) => usage.skillSlug)).toEqual(["angular", "react"]);
  });
});
