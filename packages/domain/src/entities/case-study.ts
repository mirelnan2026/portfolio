import { z } from "zod";
import { slugSchema } from "../values/slug";
import { sourceSchema } from "../values/source";
import { httpsUrlSchema, textSchema } from "../values/text";

/**
 * A story told as context → approach → outcome, plus what it shows about the owner.
 * It links to the experience (and optionally the phase) it comes from.
 */
export const caseStudySchema = z
  .strictObject({
    slug: slugSchema,
    title: textSchema,
    context: textSchema,
    approach: textSchema,
    outcome: textSchema,
    whatItShows: textSchema,
    experienceSlug: slugSchema.nullable(),
    phaseSlug: slugSchema.nullable(),
    url: httpsUrlSchema.nullable(),
    skillSlugs: z.array(slugSchema),
    source: sourceSchema,
  })
  .refine((caseStudy) => caseStudy.phaseSlug === null || caseStudy.experienceSlug !== null, {
    message: "A phase can only be set together with its experience",
    path: ["phaseSlug"],
  });

export type CaseStudy = z.infer<typeof caseStudySchema>;
