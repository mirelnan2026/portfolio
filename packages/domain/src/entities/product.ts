import { z } from "zod";
import { slugSchema } from "../values/slug";
import { httpsUrlSchema, textSchema } from "../values/text";

/**
 * A public product the owner worked on, described from its public page.
 * It is context for the site only: never evidence of a contribution, and never
 * returned by the AI tools (see "Product context" in CLAUDE.md).
 */
export const productSchema = z.strictObject({
  slug: slugSchema,
  name: textSchema,
  url: httpsUrlSchema,
  description: textSchema,
  industrySlug: slugSchema,
  sourceUrl: httpsUrlSchema,
  retrievedOn: z.iso.date(),
});

export type Product = z.infer<typeof productSchema>;
