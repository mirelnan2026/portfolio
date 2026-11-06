import { z } from "zod";
import { sourceSchema } from "../values/source";
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
  source: sourceSchema,
});

export type Profile = z.infer<typeof profileSchema>;
