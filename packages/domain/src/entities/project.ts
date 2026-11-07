import { z } from "zod";
import { isWithin, periodSchema } from "../values/period";
import { slugSchema } from "../values/slug";
import { httpsUrlSchema, textSchema } from "../values/text";
import { toMonthIndex, yearMonthSchema } from "../values/year-month";

/** Store links for a mobile app. At least one store is required: an app with no store is not an app. */
export const mobileAppSchema = z
  .strictObject({
    appStore: httpsUrlSchema.nullable(),
    playStore: httpsUrlSchema.nullable(),
  })
  .refine((app) => app.appStore !== null || app.playStore !== null, {
    message: "A mobile app needs at least one store link",
    path: ["appStore"],
  });

/** Public links only: a link to a private repository would be a broken link for every visitor. */
export const projectLinksSchema = z.strictObject({
  website: httpsUrlSchema.nullable(),
  repository: httpsUrlSchema.nullable(),
  /** A saved copy, e.g. on the Wayback Machine, still useful once the project is offline. */
  archive: httpsUrlSchema.nullable(),
  mobileApp: mobileAppSchema.nullable(),
});

/** One achievement. Personal projects are fully owned, so there is no ownership field. */
export const projectHighlightSchema = z.strictObject({
  body: textSchema,
  /** Set when the highlight is shown as a card in the Highlights section. */
  featured: z.strictObject({ title: textSchema }).nullable(),
  sourceSlug: slugSchema,
});

/** A skill used in the project: together these are the project's stack, with evidence. */
export const projectSkillUsageSchema = z.strictObject({
  skillSlug: slugSchema,
  contextNote: textSchema.nullable(),
  sourceSlug: slugSchema,
});

/**
 * The Project aggregate: a personal project the owner fully owns.
 * Only released projects are part of the data, so `releasedOn` is required;
 * work in progress stays in the project's brief until it is released.
 */
export const projectSchema = z
  .strictObject({
    slug: slugSchema,
    name: textSchema,
    summary: textSchema,
    /** How long the owner worked on it; `end: null` while still active. */
    period: periodSchema,
    /** The first public release. */
    releasedOn: yearMonthSchema,
    /** When it went offline; null while it is still online. */
    offlineSince: yearMonthSchema.nullable(),
    links: projectLinksSchema,
    highlights: z.array(projectHighlightSchema),
    skills: z.array(projectSkillUsageSchema),
    sourceSlug: slugSchema,
  })
  .superRefine(
    (project, ctx) => {
      const release = { start: project.releasedOn, end: project.releasedOn };
      if (!isWithin(release, project.period)) {
        ctx.addIssue({
          code: "custom",
          message: "The release must fall within the project period",
          path: ["releasedOn"],
        });
      }

      if (
        project.offlineSince !== null &&
        toMonthIndex(project.offlineSince) < toMonthIndex(project.releasedOn)
      ) {
        ctx.addIssue({
          code: "custom",
          message: "A project cannot go offline before it is released",
          path: ["offlineSince"],
        });
      }
    },
    {
      // Cross-checks need well-formed months, so they run only when the fields passed.
      when: (payload) => payload.issues.length === 0,
    },
  );

export type MobileApp = z.infer<typeof mobileAppSchema>;
export type ProjectLinks = z.infer<typeof projectLinksSchema>;
export type ProjectHighlight = z.infer<typeof projectHighlightSchema>;
export type ProjectSkillUsage = z.infer<typeof projectSkillUsageSchema>;
export type Project = z.infer<typeof projectSchema>;
