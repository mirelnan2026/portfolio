import { z } from "zod";
import { slugSchema } from "../values/slug";
import { textSchema } from "../values/text";

/** Skill groups, in the order the CV lists them. */
export const skillCategorySchema = z.enum([
  "frontend",
  "ui-libraries",
  "backend-and-data",
  "testing-and-tooling",
  "cloud",
  "ai-assisted-development",
  "practices",
]);

export type SkillCategory = z.infer<typeof skillCategorySchema>;

export const skillSchema = z.strictObject({
  slug: slugSchema,
  name: textSchema,
  category: skillCategorySchema,
  sourceSlug: slugSchema,
});

export type Skill = z.infer<typeof skillSchema>;
