import { z } from "zod";
import { slugSchema } from "../values/slug";
import { textSchema } from "../values/text";

/**
 * The kinds of approved document. Each kind has its own rules:
 * - "cv": the public CV, used as written;
 * - "employment-brief": the owner's notes on work for a client, under the exclusions and
 *   confidentiality rules (see "Content rules" in CLAUDE.md);
 * - "project-brief": the owner's notes on a personal project they fully own;
 * - "skills-matrix": the owner's list of the technologies used in each role, the full version of the
 *   CV's "Technologies" lines (the CV keeps only the most relevant ones).
 */
export const sourceKindSchema = z.enum([
  "cv",
  "employment-brief",
  "project-brief",
  "skills-matrix",
]);

/**
 * An approved document that claims about the owner come from, e.g. the CV or one brief.
 * Records point to it with `sourceSlug`. Only registered sources are approved, and the AI tools
 * answer only from records that point to one. The document itself is never part of the data.
 */
export const sourceSchema = z.strictObject({
  slug: slugSchema,
  kind: sourceKindSchema,
  title: textSchema,
});

export type SourceKind = z.infer<typeof sourceKindSchema>;
export type Source = z.infer<typeof sourceSchema>;
