import { z } from "zod";
import { slugSchema } from "../values/slug";
import { httpsUrlSchema, textSchema } from "../values/text";

/**
 * What a case study is about: an experience (optionally one of its phases) or a personal project,
 * never both. The union makes "a phase without its experience" impossible to write.
 */
export const caseStudySubjectSchema = z.discriminatedUnion("kind", [
  z.strictObject({
    kind: z.literal("experience"),
    experienceSlug: slugSchema,
    phaseSlug: slugSchema.nullable(),
  }),
  z.strictObject({
    kind: z.literal("project"),
    projectSlug: slugSchema,
  }),
]);

/** A story told as context → approach → outcome, plus what it shows about the owner. */
export const caseStudySchema = z.strictObject({
  slug: slugSchema,
  title: textSchema,
  context: textSchema,
  approach: textSchema,
  outcome: textSchema,
  whatItShows: textSchema,
  about: caseStudySubjectSchema,
  url: httpsUrlSchema.nullable(),
  skillSlugs: z.array(slugSchema),
  sourceSlug: slugSchema,
});

export type CaseStudySubject = z.infer<typeof caseStudySubjectSchema>;
export type CaseStudy = z.infer<typeof caseStudySchema>;
