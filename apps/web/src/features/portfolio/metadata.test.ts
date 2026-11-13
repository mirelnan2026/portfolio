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
  it("builds the title from the name and the current role, the description from the role and the intro", () => {
    expect(portfolioMetadata(profile, "Senior Frontend Engineer (Vue)")).toMatchObject({
      title: { absolute: "Jane Doe · Senior Frontend Engineer (Vue)" },
      description: "Frontend Engineer. Likes accessible ones.",
      alternates: { canonical: "/" },
    });
  });

  it("falls back to the headline's role and the intro's only sentence", () => {
    expect(
      portfolioMetadata({ ...profile, intro: "Builds web applications." }, undefined),
    ).toMatchObject({
      title: { absolute: "Jane Doe · Frontend Engineer" },
      description: "Frontend Engineer. Builds web applications.",
    });
  });

  it.each([
    ["title", profile, `${"Very ".repeat(12)}Senior Engineer`],
    [
      "description",
      { ...profile, intro: `First. ${"Builds web applications ".repeat(8)}today.` },
      "Engineer",
    ],
  ])("fails when the %s is too long for search results", (_field, longer, currentRole) => {
    expect(() => portfolioMetadata(longer, currentRole)).toThrow(/characters, over/);
  });
});
