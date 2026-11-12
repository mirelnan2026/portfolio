// Values
export { featuredSchema } from "./values/featured";
export type { Featured } from "./values/featured";
export { periodSchema } from "./values/period";
export type { Period } from "./values/period";
export { slugSchema } from "./values/slug";
export type { Slug } from "./values/slug";
export { httpsUrlSchema, textSchema } from "./values/text";
export { toYearMonth, yearMonthSchema } from "./values/year-month";
export type { YearMonth } from "./values/year-month";

// Entities
export { caseStudySchema, caseStudySubjectSchema } from "./entities/case-study";
export type { CaseStudy, CaseStudySubject } from "./entities/case-study";
export { cvDataSchema } from "./entities/cv-data";
export type { CvData } from "./entities/cv-data";
export { educationSchema } from "./entities/education";
export type { Education } from "./entities/education";
export {
  employmentTypeSchema,
  experienceSchema,
  highlightSchema,
  ownershipSchema,
  phaseSchema,
  productLinkSchema,
  skillUsageSchema,
  workModeSchema,
} from "./entities/experience";
export type {
  EmploymentType,
  Experience,
  Highlight,
  Ownership,
  Phase,
  ProductLink,
  SkillUsage,
  WorkMode,
} from "./entities/experience";
export { industrySchema } from "./entities/industry";
export type { Industry } from "./entities/industry";
export { cefrLevelSchema, languageSchema } from "./entities/language";
export type { CefrLevel, Language } from "./entities/language";
export { productSchema } from "./entities/product";
export type { Product } from "./entities/product";
export { profileSchema } from "./entities/profile";
export type { Profile } from "./entities/profile";
export {
  mobileAppSchema,
  projectHighlightSchema,
  projectLinksSchema,
  projectSchema,
  projectSkillUsageSchema,
} from "./entities/project";
export type {
  MobileApp,
  Project,
  ProjectHighlight,
  ProjectLinks,
  ProjectSkillUsage,
} from "./entities/project";
export { skillCategorySchema, skillSchema } from "./entities/skill";
export type { Skill, SkillCategory } from "./entities/skill";
export { sourceKindSchema, sourceSchema } from "./entities/source";
export type { Source, SourceKind } from "./entities/source";

// Repositories (ports)
export type { CaseStudyRepository } from "./repositories/case-study-repository";
export type { EducationRepository } from "./repositories/education-repository";
export type { ExperienceRepository } from "./repositories/experience-repository";
export type { IndustryRepository } from "./repositories/industry-repository";
export type { LanguageRepository } from "./repositories/language-repository";
export type { ProductRepository } from "./repositories/product-repository";
export type { ProfileRepository } from "./repositories/profile-repository";
export type { ProjectRepository } from "./repositories/project-repository";
export type { Repositories } from "./repositories/repositories";
export type { SkillRepository } from "./repositories/skill-repository";
export type { SourceRepository } from "./repositories/source-repository";

// Rules
export { formatDuration, monthsBetween, toDuration } from "./rules/duration";
export type { Duration } from "./rules/duration";
export { visibleLinks } from "./rules/project-links";
