import type { Profile } from "@mirelnan/domain";
import { describe, expect, it } from "vitest";
import { jsonLdText, profilePageJsonLd } from "./structured-data";

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

describe("profilePageJsonLd", () => {
  it("describes the owner as the page's main entity", () => {
    const data = profilePageJsonLd({
      profile,
      role: "Frontend Engineer",
      knowsAbout: ["Angular", "Web Development"],
      education: [
        {
          slug: "a-degree",
          degree: "A degree",
          institution: "A University",
          location: "Bucharest, Romania",
          startYear: 2006,
          endYear: 2009,
          sourceSlug: "cv",
        },
      ],
      url: "https://example.com",
    });
    expect(data).toMatchObject({
      "@type": "ProfilePage",
      mainEntity: {
        "@type": "Person",
        name: "Jane Doe",
        jobTitle: "Frontend Engineer",
        sameAs: ["https://www.linkedin.com/in/jane-doe"],
        address: { addressLocality: "Bucharest", addressCountry: "Romania" },
        knowsAbout: ["Angular", "Web Development"],
        alumniOf: [{ "@type": "CollegeOrUniversity", name: "A University" }],
      },
    });
  });
});

describe("jsonLdText", () => {
  it("escapes '<' so a value cannot close the script tag", () => {
    const text = jsonLdText({ name: "</script><script>alert(1)</script>" });
    expect(text).not.toContain("<");
    expect(JSON.parse(text)).toEqual({ name: "</script><script>alert(1)</script>" });
  });
});
