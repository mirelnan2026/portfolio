import { z } from "zod";
import { slugSchema } from "../values/slug";
import { textSchema } from "../values/text";

export const cefrLevelSchema = z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]);

/**
 * A spoken language. `code` is the ISO 639-1 code ("en", "ro"): it identifies
 * the language and lets the UI mark foreign words with the `lang` attribute,
 * so screen readers pronounce them correctly.
 */
export const languageSchema = z.strictObject({
  code: z.string().regex(/^[a-z]{2}$/, "Expected an ISO 639-1 code"),
  name: textSchema,
  proficiency: textSchema,
  cefrLevel: cefrLevelSchema.nullable(),
  sourceSlug: slugSchema,
});

export type CefrLevel = z.infer<typeof cefrLevelSchema>;
export type Language = z.infer<typeof languageSchema>;
