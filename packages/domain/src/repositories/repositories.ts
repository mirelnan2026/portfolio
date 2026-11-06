import type { CaseStudyRepository } from "./case-study-repository";
import type { EducationRepository } from "./education-repository";
import type { ExperienceRepository } from "./experience-repository";
import type { IndustryRepository } from "./industry-repository";
import type { LanguageRepository } from "./language-repository";
import type { ProductRepository } from "./product-repository";
import type { ProfileRepository } from "./profile-repository";
import type { SkillRepository } from "./skill-repository";

/**
 * Every port, one per aggregate root. The composition root builds one of these;
 * each consumer asks only for the ports it needs, e.g. `Pick<Repositories, "experiences">`.
 */
export interface Repositories {
  profile: ProfileRepository;
  experiences: ExperienceRepository;
  skills: SkillRepository;
  caseStudies: CaseStudyRepository;
  industries: IndustryRepository;
  products: ProductRepository;
  education: EducationRepository;
  languages: LanguageRepository;
}
