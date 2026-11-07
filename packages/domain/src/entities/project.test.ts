import { describe, expect, it } from "vitest";
import { projectSchema, type Project } from "./project";

const project = {
  slug: "example-app",
  name: "Example App",
  summary: "A web and mobile app for tracking reading lists.",
  period: { start: "2027-01", end: null },
  releasedOn: "2027-03",
  offlineSince: null,
  links: {
    website: "https://example.com",
    repository: null,
    archive: null,
    mobileApp: { appStore: "https://apps.apple.com/app/example", playStore: null },
  },
  highlights: [
    { body: "Built the offline-first sync.", featured: null, sourceSlug: "example-brief" },
  ],
  skills: [{ skillSlug: "react", contextNote: "Web app", sourceSlug: "example-brief" }],
  sourceSlug: "example-brief",
} satisfies Project;

function issuePaths(input: unknown) {
  return projectSchema.safeParse(input).error?.issues.map((issue) => issue.path) ?? [];
}

describe("projectSchema", () => {
  it("accepts a valid project", () => {
    expect(projectSchema.safeParse(project).success).toBe(true);
  });

  it("accepts a project with no public links", () => {
    const links = { website: null, repository: null, archive: null, mobileApp: null };
    expect(projectSchema.safeParse({ ...project, links }).success).toBe(true);
  });

  it("rejects a project that is not released", () => {
    expect(projectSchema.safeParse({ ...project, releasedOn: null }).success).toBe(false);
  });

  it("rejects a release outside the project period", () => {
    expect(issuePaths({ ...project, releasedOn: "2026-12" })).toEqual([["releasedOn"]]);
  });

  it("rejects going offline before the release", () => {
    expect(issuePaths({ ...project, offlineSince: "2027-02" })).toEqual([["offlineSince"]]);
  });

  it("rejects a mobile app without any store link", () => {
    const links = { ...project.links, mobileApp: { appStore: null, playStore: null } };
    expect(issuePaths({ ...project, links })).toEqual([["links", "mobileApp", "appStore"]]);
  });

  it("rejects an ownership field, because personal projects are fully owned", () => {
    const highlights = [{ ...project.highlights[0], ownership: "owned" }];
    expect(projectSchema.safeParse({ ...project, highlights }).success).toBe(false);
  });
});
