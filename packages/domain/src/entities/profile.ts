import { z } from "zod";
import { slugSchema } from "../values/slug";
import { httpsUrlSchema, textSchema } from "../values/text";

/**
 * The owner's public profile. There is deliberately no phone field, and the
 * object is strict: data with an unknown key, such as "phone", is rejected.
 */
export const profileSchema = z
  .strictObject({
    name: textSchema,
    headline: textSchema,
    /** The opening of `summary`, word for word: what the first screen shows. */
    intro: textSchema,
    summary: textSchema,
    location: textSchema,
    availability: textSchema,
    email: z.email(),
    linkedinUrl: httpsUrlSchema,
    interests: z.array(textSchema),
    sourceSlug: slugSchema,
  })
  .refine((profile) => profile.summary.startsWith(profile.intro), {
    // The intro is a shorter cut of the CV's own words, never a rewrite.
    message: "The intro must be the opening of the summary",
    path: ["intro"],
    when: (payload) => payload.issues.length === 0,
  });

export type Profile = z.infer<typeof profileSchema>;
