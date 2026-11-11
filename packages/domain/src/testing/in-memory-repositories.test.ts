import { describe, expect, it } from "vitest";
import type { CvData } from "../entities/cv-data";
import type { Experience } from "../entities/experience";
import type { Profile } from "../entities/profile";
import { createInMemoryRepositories } from "./in-memory-repositories";

const profile = {
  name: "Jane Doe",
  headline: "Frontend Engineer",
  intro: "Builds web applications.",
  summary: "Builds web applications.",
  location: "Bucharest, Romania",
  availability: "Open to remote",
  email: "jane@example.com",
  linkedinUrl: "https://www.linkedin.com/in/jane-doe",
  competencies: [],
  interests: [],
  sourceSlug: "cv",
} satisfies Profile;

const experience = {
  slug: "example-corp",
  company: "Example Corp",
  role: "Frontend Engineer",
  employmentType: "full-time",
  workMode: "hybrid",
  location: "Bucharest, Romania",
  period: { start: "2020-01", end: "2022-12" },
  phases: [],
  highlights: [],
  skills: [],
  products: [],
  sourceSlug: "cv",
} satisfies Experience;

const data: CvData = {
  sources: [{ slug: "cv", kind: "cv", title: "CV" }],
  profile,
  experiences: [experience],
  projects: [],
  skills: [],
  caseStudies: [],
  industries: [],
  products: [],
  education: [],
  languages: [],
};

describe("createInMemoryRepositories", () => {
  const repositories = createInMemoryRepositories(data);

  it("lists the registered sources", async () => {
    await expect(repositories.sources.list()).resolves.toEqual(data.sources);
  });

  it("returns the profile", async () => {
    await expect(repositories.profile.get()).resolves.toEqual(profile);
  });

  it("lists experiences", async () => {
    await expect(repositories.experiences.list()).resolves.toEqual([experience]);
  });

  it("finds an experience by slug", async () => {
    await expect(repositories.experiences.getBySlug("example-corp")).resolves.toEqual(experience);
  });

  it("returns null for an unknown slug", async () => {
    await expect(repositories.experiences.getBySlug("missing")).resolves.toBeNull();
  });
});
