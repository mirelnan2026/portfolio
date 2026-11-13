import type { CvData } from "../entities/cv-data";
import type { Repositories } from "../repositories/repositories";

/**
 * An adapter that implements every port over plain arrays, with no database.
 * For tests and local experiments; production uses the Drizzle adapter from @mirelnan/db.
 */
export function createInMemoryRepositories(data: CvData): Repositories {
  return {
    sources: { list: () => Promise.resolve(data.sources) },
    profile: { get: () => Promise.resolve(data.profile) },
    experiences: {
      list: () => Promise.resolve(data.experiences),
      getBySlug: (slug) =>
        Promise.resolve(data.experiences.find((item) => item.slug === slug) ?? null),
    },
    projects: {
      list: () => Promise.resolve(data.projects),
      getBySlug: (slug) =>
        Promise.resolve(data.projects.find((item) => item.slug === slug) ?? null),
    },
    skills: { list: () => Promise.resolve(data.skills) },
    caseStudies: {
      list: () => Promise.resolve(data.caseStudies),
      getBySlug: (slug) =>
        Promise.resolve(data.caseStudies.find((item) => item.slug === slug) ?? null),
    },
    industries: { list: () => Promise.resolve(data.industries) },
    products: { list: () => Promise.resolve(data.products) },
    education: { list: () => Promise.resolve(data.education) },
    languages: { list: () => Promise.resolve(data.languages) },
    workflow: { list: () => Promise.resolve(data.workflow) },
  };
}
