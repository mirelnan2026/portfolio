import { describe, expect, it } from "vitest";
import type { Project } from "../entities/project";
import { visibleLinks } from "./project-links";

const project = {
  slug: "example-app",
  name: "Example App",
  summary: "A web app.",
  period: { start: "2027-01", end: "2028-06" },
  releasedOn: "2027-03",
  offlineSince: null,
  links: {
    website: "https://example.com",
    repository: "https://github.com/example/app",
    archive: "https://web.archive.org/web/2028/https://example.com",
    mobileApp: { appStore: null, playStore: "https://play.google.com/store/apps/details?id=x" },
  },
  highlights: [],
  skills: [],
  sourceSlug: "example-brief",
} satisfies Project;

describe("visibleLinks", () => {
  it("shows every link while the project is online", () => {
    expect(visibleLinks(project)).toEqual(project.links);
  });

  it("hides the website and store links once the project is offline", () => {
    expect(visibleLinks({ ...project, offlineSince: "2028-06" })).toEqual({
      ...project.links,
      website: null,
      mobileApp: null,
    });
  });
});
