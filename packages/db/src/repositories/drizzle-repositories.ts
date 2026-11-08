import type { Repositories } from "@mirelnan/domain";
import type { Database } from "../database";
import { createDrizzleCaseStudyRepository } from "./drizzle-case-study-repository";
import { createDrizzleEducationRepository } from "./drizzle-education-repository";
import { createDrizzleExperienceRepository } from "./drizzle-experience-repository";
import { createDrizzleIndustryRepository } from "./drizzle-industry-repository";
import { createDrizzleLanguageRepository } from "./drizzle-language-repository";
import { createDrizzleProductRepository } from "./drizzle-product-repository";
import { createDrizzleProfileRepository } from "./drizzle-profile-repository";
import { createDrizzleProjectRepository } from "./drizzle-project-repository";
import { createDrizzleSkillRepository } from "./drizzle-skill-repository";
import { createDrizzleSourceRepository } from "./drizzle-source-repository";

/** Every port, read from Postgres. The composition root calls this once with its database. */
export function createDrizzleRepositories(db: Database): Repositories {
  return {
    sources: createDrizzleSourceRepository(db),
    profile: createDrizzleProfileRepository(db),
    experiences: createDrizzleExperienceRepository(db),
    projects: createDrizzleProjectRepository(db),
    skills: createDrizzleSkillRepository(db),
    caseStudies: createDrizzleCaseStudyRepository(db),
    industries: createDrizzleIndustryRepository(db),
    products: createDrizzleProductRepository(db),
    education: createDrizzleEducationRepository(db),
    languages: createDrizzleLanguageRepository(db),
  };
}
