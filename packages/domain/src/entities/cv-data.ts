import { z } from "zod";
import { caseStudySchema } from "./case-study";
import { educationSchema } from "./education";
import { experienceSchema } from "./experience";
import { industrySchema } from "./industry";
import { languageSchema } from "./language";
import { productSchema } from "./product";
import { profileSchema } from "./profile";
import { projectSchema } from "./project";
import { skillSchema } from "./skill";
import { sourceSchema } from "./source";
import { workflowStepSchema } from "./workflow-step";

/**
 * The whole CV as one snapshot: every aggregate, in display order.
 * The cv-data package exports it, and the seed validates it with this schema before loading it.
 * References between aggregates (a skill slug, a source slug) are checked by the cv-data tests
 * and by the database foreign keys.
 */
export const cvDataSchema = z.strictObject({
  sources: z.array(sourceSchema),
  profile: profileSchema,
  experiences: z.array(experienceSchema),
  projects: z.array(projectSchema),
  skills: z.array(skillSchema),
  caseStudies: z.array(caseStudySchema),
  industries: z.array(industrySchema),
  products: z.array(productSchema),
  education: z.array(educationSchema),
  languages: z.array(languageSchema),
  workflow: z.array(workflowStepSchema),
});

export type CvData = z.infer<typeof cvDataSchema>;
