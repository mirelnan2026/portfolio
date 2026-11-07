import { sql } from "drizzle-orm";
import { check, foreignKey, integer, pgTable, primaryKey, text, unique } from "drizzle-orm/pg-core";
import { id, position, slug } from "./columns";
import { experiencePhases, experiences } from "./experiences";
import { projects } from "./projects";
import { skills } from "./skills";
import { sources } from "./sources";

/**
 * `about` from the domain is a discriminated union: an experience (with an optional phase)
 * or a project. Here it is three nullable foreign keys, and a check allows only those two shapes.
 */
export const caseStudies = pgTable(
  "case_studies",
  {
    id: id(),
    slug: slug(),
    title: text().notNull(),
    context: text().notNull(),
    approach: text().notNull(),
    outcome: text().notNull(),
    whatItShows: text().notNull(),
    experienceId: integer().references(() => experiences.id),
    phaseId: integer(),
    projectId: integer().references(() => projects.id),
    url: text(),
    position: position(),
    sourceId: integer()
      .notNull()
      .references(() => sources.id),
  },
  (table) => [
    unique().on(table.slug),
    foreignKey({
      name: "case_studies_phase_fk",
      columns: [table.experienceId, table.phaseId],
      foreignColumns: [experiencePhases.experienceId, experiencePhases.id],
    }),
    check(
      "case_studies_about_check",
      sql`(${table.experienceId} is not null and ${table.projectId} is null)
        or (${table.projectId} is not null and ${table.experienceId} is null and ${table.phaseId} is null)`,
    ),
  ],
);

export const caseStudySkills = pgTable(
  "case_study_skills",
  {
    caseStudyId: integer()
      .notNull()
      .references(() => caseStudies.id, { onDelete: "cascade" }),
    skillId: integer()
      .notNull()
      .references(() => skills.id),
    position: position(),
  },
  (table) => [primaryKey({ columns: [table.caseStudyId, table.skillId] })],
);
