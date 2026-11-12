import { cvData } from "@mirelnan/cv-data";
import type { CaseStudy, CvData, Project, Repositories, Source } from "@mirelnan/domain";
import { beforeAll, describe, expect, it } from "vitest";
import { writeCvData } from "../seed/write-cv-data";
import { createTestDatabase } from "../test-database";
import { createDrizzleProfileRepository } from "./drizzle-profile-repository";
import { createDrizzleRepositories } from "./drizzle-repositories";

// Fictitious records, so the Project aggregate and a case study about a project are covered
// before the CV has any project.
const exampleBrief: Source = {
  slug: "example-brief",
  kind: "project-brief",
  title: "Example project brief",
};

const exampleProject: Project = {
  slug: "example-app",
  name: "Example App",
  summary: "A fictitious project for the round-trip test.",
  period: { start: "2024-01", end: "2024-06" },
  releasedOn: "2024-05",
  offlineSince: "2025-01",
  links: {
    website: "https://example.com",
    repository: null,
    archive: "https://web.archive.org/web/2024/https://example.com",
    mobileApp: { appStore: null, playStore: "https://play.example.com/example-app" },
  },
  highlights: [
    {
      body: "Built the whole app.",
      featured: { title: "Example card", rank: 5 },
      sourceSlug: "example-brief",
    },
    { body: "Shipped it to the store.", featured: null, sourceSlug: "example-brief" },
  ],
  skills: [
    { skillSlug: "typescript", contextNote: "The whole codebase.", sourceSlug: "example-brief" },
  ],
  sourceSlug: "example-brief",
};

const exampleCaseStudy: CaseStudy = {
  slug: "example-app-story",
  title: "An example story",
  context: "A fictitious context.",
  approach: "A fictitious approach.",
  outcome: "A fictitious outcome.",
  whatItShows: "That the round trip works.",
  about: { kind: "project", projectSlug: "example-app" },
  url: "https://example.com/story",
  skillSlugs: ["typescript"],
  sourceSlug: "example-brief",
};

const data: CvData = {
  ...cvData,
  sources: [...cvData.sources, exampleBrief],
  projects: [...cvData.projects, exampleProject],
  caseStudies: [...cvData.caseStudies, exampleCaseStudy],
};

let repositories: Repositories;

beforeAll(async () => {
  const db = await createTestDatabase();
  await writeCvData(db, data);
  repositories = createDrizzleRepositories(db);
});

// Round trip: what the seed writes, the repositories read back as the same domain objects.
describe("Drizzle repositories, after the seed", () => {
  it("read the sources", async () => {
    expect(await repositories.sources.list()).toStrictEqual(data.sources);
  });

  it("read the profile", async () => {
    expect(await repositories.profile.get()).toStrictEqual(data.profile);
  });

  it("read the experiences, with their phases, highlights, skills and products", async () => {
    expect(await repositories.experiences.list()).toStrictEqual(data.experiences);
  });

  it("read the projects, with their links, highlights and skills", async () => {
    expect(await repositories.projects.list()).toStrictEqual(data.projects);
  });

  it("read the skills", async () => {
    expect(await repositories.skills.list()).toStrictEqual(data.skills);
  });

  it("read the case studies, with what they are about and their skills", async () => {
    expect(await repositories.caseStudies.list()).toStrictEqual(data.caseStudies);
  });

  it("read the industries", async () => {
    expect(await repositories.industries.list()).toStrictEqual(data.industries);
  });

  it("read the products", async () => {
    expect(await repositories.products.list()).toStrictEqual(data.products);
  });

  it("read the education", async () => {
    expect(await repositories.education.list()).toStrictEqual(data.education);
  });

  it("read the languages", async () => {
    expect(await repositories.languages.list()).toStrictEqual(data.languages);
  });
});

describe("Drizzle repositories, by slug", () => {
  it("read one experience", async () => {
    const [first] = data.experiences;
    expect(await repositories.experiences.getBySlug(first?.slug ?? "")).toStrictEqual(first);
  });

  it("read one project", async () => {
    expect(await repositories.projects.getBySlug("example-app")).toStrictEqual(exampleProject);
  });

  it("read one case study", async () => {
    expect(await repositories.caseStudies.getBySlug("example-app-story")).toStrictEqual(
      exampleCaseStudy,
    );
  });

  it("return null for an unknown slug", async () => {
    expect(await repositories.experiences.getBySlug("no-such-slug")).toBeNull();
    expect(await repositories.projects.getBySlug("no-such-slug")).toBeNull();
    expect(await repositories.caseStudies.getBySlug("no-such-slug")).toBeNull();
  });
});

describe("Drizzle profile repository, before the seed", () => {
  it("fails with a clear message when there is no profile", async () => {
    const empty = await createTestDatabase();
    await expect(createDrizzleProfileRepository(empty).get()).rejects.toThrow(
      "No profile in the database: run the seed first",
    );
  });
});
