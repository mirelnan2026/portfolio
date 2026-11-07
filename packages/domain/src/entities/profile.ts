import { z } from "zod";
import { slugSchema } from "../values/slug";
import { httpsUrlSchema, textSchema } from "../values/text";

/**
 * The owner's public profile. There is deliberately no phone field, and the
 * object is strict: data with an unknown key, such as "phone", is rejected.
 */
export const profileSchema = z.strictObject({
  name: textSchema,
  headline: textSchema,
  summary: textSchema,
  location: textSchema,
  availability: textSchema,
  email: z.email(),
  linkedinUrl: httpsUrlSchema,
  interests: z.array(textSchema),
  sourceSlug: slugSchema,
});

export type Profile = z.infer<typeof profileSchema>;
