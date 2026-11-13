import type { CaseStudy, Experience, Profile } from "@mirelnan/domain";
import { describe, expect, it } from "vitest";
import { llmsTxt } from "./llms";

const profile = {
  name: "Jane Doe",
  headline: "Frontend Engineer · Accessible interfaces",
  intro: "Builds web applications.",
  summary: "Builds web applications. Lives in Bucharest.",
  location: "Bucharest, Romania",
  availability: "Open to remote",
  email: "jane@example.com",
  linkedinUrl: "https://www.linkedin.com/in/jane-doe",
  competencies: [],
  interests: [],
  sourceSlug: "cv",
} satisfies Profile;

const experience = {
  company: "Example Corp",
  role: "Frontend Engineer",
  period: { start: "2022-03", end: "2024-10" },
  highlights: [
    { body: "Owned billing.", ownership: "owned" },
    { body: "Built features.", ownership: "contributed" },
  ],
} as unknown as Experience;

const caseStudy = {
  slug: "a-story",
  title: "A story",
  context: "Context.",
  approach: "Approach.",
  outcome: "Outcome.",
  whatItShows: "What it shows.",
} as unknown as CaseStudy;

describe("llmsTxt", () => {
  const text = llmsTxt({
    profile,
    experiences: [experience],
    skills: [{ slug: "angular", name: "Angular", months: 123, roles: [], notes: [] }],
    caseStudies: [caseStudy],
    workflow: [{ slug: "specify", title: "Specify", body: "I write it.", sourceSlug: "cv" }],
    education: [],
    languages: [],
    url: "https://example.com",
  });

  it("starts with the name and the summary in the llms.txt shape", () => {
    expect(
      text.startsWith(
        "# Jane Doe\n\n> Frontend Engineer · Accessible interfaces\n\nBuilds web applications. Lives in Bucharest.",
      ),
    ).toBe(true);
  });

  it("marks only owned highlights as owned", () => {
    expect(text).toContain("- Owned billing. (owned)");
    expect(text).toContain("- Built features.\n");
  });

  it("states skills in words and links case studies to the page", () => {
    expect(text).toContain("- Angular: over 10 years");
    expect(text).toContain("### [A story](https://example.com/#case-study-a-story)");
  });
});
