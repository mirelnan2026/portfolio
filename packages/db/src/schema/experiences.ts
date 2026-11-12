import { employmentTypeSchema, ownershipSchema, workModeSchema } from "@mirelnan/domain";
import { sql } from "drizzle-orm";
import { check, foreignKey, integer, pgEnum, pgTable, text, unique } from "drizzle-orm/pg-core";
import { id, month, position, slug } from "./columns";
import { industries } from "./industries";
import { products } from "./products";
import { skills } from "./skills";
import { sources } from "./sources";

export const employmentType = pgEnum("employment_type", employmentTypeSchema.enum);
export const workMode = pgEnum("work_mode", workModeSchema.enum);
export const ownership = pgEnum("ownership", ownershipSchema.enum);

/** The root of the Experience aggregate. Its parts are deleted with it (`onDelete: "cascade"`). */
export const experiences = pgTable(
  "experiences",
  {
    id: id(),
    slug: slug(),
    company: text().notNull(),
    role: text().notNull(),
    employmentType: employmentType().notNull(),
    workMode: workMode(),
    location: text(),
    startedOn: month().notNull(),
    endedOn: month(),
    position: position(),
    sourceId: integer()
      .notNull()
      .references(() => sources.id),
  },
  (table) => [
    unique().on(table.slug),
    check(
      "experiences_period_check",
      sql`${table.endedOn} is null or ${table.endedOn} >= ${table.startedOn}`,
    ),
  ],
);

export const experiencePhases = pgTable(
  "experience_phases",
  {
    id: id(),
    experienceId: integer()
      .notNull()
      .references(() => experiences.id, { onDelete: "cascade" }),
    slug: slug(),
    title: text().notNull(),
    startedOn: month().notNull(),
    endedOn: month(),
    industryId: integer()
      .notNull()
      .references(() => industries.id),
    summary: text().notNull(),
    position: position(),
    sourceId: integer()
      .notNull()
      .references(() => sources.id),
  },
  (table) => [
    // A phase slug is unique within its experience, not across experiences.
    unique("experience_phases_experience_id_slug_unique").on(table.experienceId, table.slug),
    // The target of the composite foreign keys below: "this phase, of this experience".
    unique("experience_phases_experience_id_id_unique").on(table.experienceId, table.id),
    check(
      "experience_phases_period_check",
      sql`${table.endedOn} is null or ${table.endedOn} >= ${table.startedOn}`,
    ),
  ],
);

/*
 * Highlights, skills and products may belong to one phase. They point at it with the pair
 * (experience_id, phase_id), so the phase must belong to the same experience. When phase_id is
 * null, Postgres does not check the pair (MATCH SIMPLE), so the part belongs to the whole experience.
 */

export const experienceHighlights = pgTable(
  "experience_highlights",
  {
    id: id(),
    experienceId: integer()
      .notNull()
      .references(() => experiences.id, { onDelete: "cascade" }),
    phaseId: integer(),
    body: text().notNull(),
    ownership: ownership().notNull(),
    /** Not null when the highlight is shown as a card in the Highlights section, with its place there. */
    featuredTitle: text(),
    featuredRank: integer(),
    position: position(),
    sourceId: integer()
      .notNull()
      .references(() => sources.id),
  },
  (table) => [
    foreignKey({
      name: "experience_highlights_phase_fk",
      columns: [table.experienceId, table.phaseId],
      foreignColumns: [experiencePhases.experienceId, experiencePhases.id],
    }).onDelete("cascade"),
  ],
);

export const experienceSkills = pgTable(
  "experience_skills",
  {
    id: id(),
    experienceId: integer()
      .notNull()
      .references(() => experiences.id, { onDelete: "cascade" }),
    phaseId: integer(),
    skillId: integer()
      .notNull()
      .references(() => skills.id),
    contextNote: text(),
    position: position(),
    sourceId: integer()
      .notNull()
      .references(() => sources.id),
  },
  (table) => [
    foreignKey({
      name: "experience_skills_phase_fk",
      columns: [table.experienceId, table.phaseId],
      foreignColumns: [experiencePhases.experienceId, experiencePhases.id],
    }).onDelete("cascade"),
    // One row per skill and phase; "no phase" counts as one value (NULLS NOT DISTINCT).
    unique("experience_skills_experience_id_phase_id_skill_id_unique")
      .on(table.experienceId, table.phaseId, table.skillId)
      .nullsNotDistinct(),
  ],
);

/** Products are site context, not claims about the owner, so there is no `source_id`. */
export const experienceProducts = pgTable(
  "experience_products",
  {
    id: id(),
    experienceId: integer()
      .notNull()
      .references(() => experiences.id, { onDelete: "cascade" }),
    phaseId: integer(),
    productId: integer()
      .notNull()
      .references(() => products.id),
    position: position(),
  },
  (table) => [
    foreignKey({
      name: "experience_products_phase_fk",
      columns: [table.experienceId, table.phaseId],
      foreignColumns: [experiencePhases.experienceId, experiencePhases.id],
    }).onDelete("cascade"),
    unique("experience_products_experience_id_phase_id_product_id_unique")
      .on(table.experienceId, table.phaseId, table.productId)
      .nullsNotDistinct(),
  ],
);
