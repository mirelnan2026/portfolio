import type { CaseStudy, Experience, Skill } from "@mirelnan/domain";
import { describe, expect, it } from "vitest";
import { caseStudyCards } from "./case-studies";

const experience = {
  slug: "example-corp",
  company: "Example Corp",
  period: { start: "2022-03", end: "2024-10" },
  phases: [
    {
      slug: "second-product",
      title: "Second product",
      period: { start: "2024-01", end: "2024-10" },
    },
  ],
} as unknown as Experience;

const story = (about: CaseStudy["about"]): CaseStudy => ({
  slug: "a-story",
  title: "A story",
  context: "Context.",
  approach: "Approach.",
  outcome: "Outcome.",
  whatItShows: "What it shows.",
  about,
  url: null,
  skillSlugs: ["angular", "unknown"],
  sourceSlug: "cv",
});

const skills: Skill[] = [
  { slug: "angular", name: "Angular", category: "frontend", sourceSlug: "cv" },
];

describe("caseStudyCards", () => {
  it("links a story about a phase to its role, with the phase and its years", () => {
    const [card] = caseStudyCards(
      [story({ kind: "experience", experienceSlug: "example-corp", phaseSlug: "second-product" })],
      [experience],
      skills,
    );
    expect(card?.subject).toEqual({
      label: "Example Corp",
      href: "#experience-example-corp",
      period: "Second product · 2024",
    });
    expect(card?.skills).toEqual(["Angular"]);
  });

  it("uses the role's years when the story is about the whole role", () => {
    const [card] = caseStudyCards(
      [story({ kind: "experience", experienceSlug: "example-corp", phaseSlug: null })],
      [experience],
      skills,
    );
    expect(card?.subject?.period).toBe("2022–2024");
  });

  it("has no subject for a personal project, which the page does not show yet", () => {
    const [card] = caseStudyCards(
      [story({ kind: "project", projectSlug: "a-project" })],
      [],
      skills,
    );
    expect(card?.subject).toBeNull();
  });
});
