import type { CaseStudy } from "../entities/case-study";
import type { Education } from "../entities/education";
import type { Experience } from "../entities/experience";
import type { Industry } from "../entities/industry";
import type { Language } from "../entities/language";
import type { Product } from "../entities/product";
import type { Profile } from "../entities/profile";
import type { Skill } from "../entities/skill";
import type { Repositories } from "../repositories/repositories";

/** Everything the in-memory adapter serves. The cv-data package exports the same shape. */
export interface InMemoryData {
  profile: Profile;
  experiences: Experience[];
  skills: Skill[];
  caseStudies: CaseStudy[];
  industries: Industry[];
  products: Product[];
  education: Education[];
  languages: Language[];
}

/**
 * An adapter that implements every port over plain arrays, with no database.
 * For tests and local experiments; production uses the Drizzle adapter from @mirelnan/db.
 */
export function createInMemoryRepositories(data: InMemoryData): Repositories {
  return {
    profile: { get: () => Promise.resolve(data.profile) },
    experiences: {
      list: () => Promise.resolve(data.experiences),
      getBySlug: (slug) =>
        Promise.resolve(data.experiences.find((item) => item.slug === slug) ?? null),
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
  };
}
