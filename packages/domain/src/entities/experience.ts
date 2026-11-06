import { z } from "zod";
import { isWithin, periodSchema } from "../values/period";
import { slugSchema } from "../values/slug";
import { sourceSchema } from "../values/source";
import { textSchema } from "../values/text";

export const employmentTypeSchema = z.enum(["full-time", "contract", "freelance"]);
export const workModeSchema = z.enum(["remote", "hybrid", "on-site"]);

/**
 * "owned": the owner led it end to end. "contributed": the owner was one of the people who built it.
 * The AI tools must never present a contributed highlight as owned.
 */
export const ownershipSchema = z.enum(["owned", "contributed"]);

/** One stage of a long engagement, e.g. one of the three products of a single contract. */
export const phaseSchema = z.strictObject({
  slug: slugSchema,
  title: textSchema,
  period: periodSchema,
  industrySlug: slugSchema,
  summary: textSchema,
  source: sourceSchema,
});

/** One achievement. `phaseSlug` is null when it belongs to the experience as a whole. */
export const highlightSchema = z.strictObject({
  body: textSchema,
  ownership: ownershipSchema,
  /** Set when the highlight is shown as a card in the Highlights section. */
  featured: z.strictObject({ title: textSchema }).nullable(),
  phaseSlug: slugSchema.nullable(),
  source: sourceSchema,
});

/** A skill used in this experience, with the evidence behind the skill filter and job match. */
export const skillUsageSchema = z.strictObject({
  skillSlug: slugSchema,
  phaseSlug: slugSchema.nullable(),
  contextNote: textSchema.nullable(),
  source: sourceSchema,
});

/** A public product worked on. Site context only, never given to the AI tools. */
export const productLinkSchema = z.strictObject({
  productSlug: slugSchema,
  phaseSlug: slugSchema.nullable(),
});

/**
 * The Experience aggregate: a role together with its phases, highlights, skills and products.
 * It is read and validated as a whole, so its rules can check the parts against each other.
 */
export const experienceSchema = z
  .strictObject({
    slug: slugSchema,
    company: textSchema,
    role: textSchema,
    employmentType: employmentTypeSchema,
    workMode: workModeSchema.nullable(),
    location: textSchema.nullable(),
    period: periodSchema,
    phases: z.array(phaseSchema),
    highlights: z.array(highlightSchema),
    skills: z.array(skillUsageSchema),
    products: z.array(productLinkSchema),
    source: sourceSchema,
  })
  .superRefine(
    (experience, ctx) => {
      const phaseSlugs = new Set<string>();

      experience.phases.forEach((phase, index) => {
        if (phaseSlugs.has(phase.slug)) {
          ctx.addIssue({
            code: "custom",
            message: `Duplicate phase "${phase.slug}"`,
            path: ["phases", index, "slug"],
          });
        }
        phaseSlugs.add(phase.slug);

        if (!isWithin(phase.period, experience.period)) {
          ctx.addIssue({
            code: "custom",
            message: "A phase must lie within the experience period",
            path: ["phases", index, "period"],
          });
        }
      });

      for (const list of ["highlights", "skills", "products"] as const) {
        experience[list].forEach((item, index) => {
          if (item.phaseSlug !== null && !phaseSlugs.has(item.phaseSlug)) {
            ctx.addIssue({
              code: "custom",
              message: `Unknown phase "${item.phaseSlug}"`,
              path: [list, index, "phaseSlug"],
            });
          }
        });
      }
    },
    {
      // Cross-checks need well-formed parts (e.g. valid months), so they run only when the fields passed.
      when: (payload) => payload.issues.length === 0,
    },
  );

export type EmploymentType = z.infer<typeof employmentTypeSchema>;
export type WorkMode = z.infer<typeof workModeSchema>;
export type Ownership = z.infer<typeof ownershipSchema>;
export type Phase = z.infer<typeof phaseSchema>;
export type Highlight = z.infer<typeof highlightSchema>;
export type SkillUsage = z.infer<typeof skillUsageSchema>;
export type ProductLink = z.infer<typeof productLinkSchema>;
export type Experience = z.infer<typeof experienceSchema>;
