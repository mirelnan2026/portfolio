import type { CaseStudy } from "./case-study";
import type { Education } from "./education";
import type { Experience } from "./experience";
import type { Industry } from "./industry";
import type { Language } from "./language";
import type { Product } from "./product";
import type { Profile } from "./profile";
import type { Project } from "./project";
import type { Skill } from "./skill";
import type { Source } from "./source";

/**
 * The whole CV as one snapshot: every aggregate, in display order.
 * The cv-data package exports it, the seed loads it into the database,
 * and the in-memory adapter serves it in tests.
 */
export interface CvData {
  sources: Source[];
  profile: Profile;
  experiences: Experience[];
  projects: Project[];
  skills: Skill[];
  caseStudies: CaseStudy[];
  industries: Industry[];
  products: Product[];
  education: Education[];
  languages: Language[];
}
