import type { Profile } from "@mirelnan/domain";
import { describe, expect, it } from "vitest";
import { portfolioMetadata } from "./metadata";

const profile = {
  name: "Jane Doe",
  headline: "Frontend Engineer · Accessible interfaces",
  intro: "Builds web applications for 10+ years. Likes accessible ones.",
  summary: "Builds web applications for 10+ years. Likes accessible ones. Lives in Bucharest.",
  location: "Bucharest, Romania",
  availability: "Open to remote",
  email: "jane@example.com",
  linkedinUrl: "https://www.linkedin.com/in/jane-doe",
  competencies: [],
  interests: [],
  sourceSlug: "cv",
} satisfies Profile;

describe("portfolioMetadata", () => {
  it("builds the title from the name and the role, and the description from the intro", () => {
    expect(portfolioMetadata(profile)).toMatchObject({
      title: { absolute: "Jane Doe · Frontend Engineer · Portfolio" },
      description: "Builds web applications for 10+ years.",
      alternates: { canonical: "/" },
    });
  });

  it.each([
    ["title", { ...profile, headline: `${"Very ".repeat(12)}Senior Engineer` }],
    ["description", { ...profile, intro: `${"Builds web applications ".repeat(8)}today.` }],
  ])("fails when the %s is too long for search results", (_field, longer) => {
    expect(() => portfolioMetadata(longer)).toThrow(/characters, over/);
  });
});
