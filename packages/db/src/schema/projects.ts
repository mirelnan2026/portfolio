import { sql } from "drizzle-orm";
import { check, integer, pgTable, text, unique } from "drizzle-orm/pg-core";
import { id, month, position, slug } from "./columns";
import { skills } from "./skills";
import { sources } from "./sources";

/**
 * The root of the Project aggregate. Links are flat nullable columns; the mapper rebuilds
 * `links.mobileApp` (null when both store links are null, which the domain allows only that way).
 */
export const projects = pgTable(
  "projects",
  {
    id: id(),
    slug: slug(),
    name: text().notNull(),
    summary: text().notNull(),
    startedOn: month().notNull(),
    endedOn: month(),
    releasedOn: month().notNull(),
    offlineSince: month(),
    websiteUrl: text(),
    repositoryUrl: text(),
    archiveUrl: text(),
    appStoreUrl: text(),
    playStoreUrl: text(),
    position: position(),
    sourceId: integer()
      .notNull()
      .references(() => sources.id),
  },
  (table) => [
    unique().on(table.slug),
    check(
      "projects_period_check",
      sql`${table.endedOn} is null or ${table.endedOn} >= ${table.startedOn}`,
    ),
    check(
      "projects_release_check",
      sql`${table.releasedOn} >= ${table.startedOn} and (${table.endedOn} is null or ${table.releasedOn} <= ${table.endedOn})`,
    ),
    check(
      "projects_offline_check",
      sql`${table.offlineSince} is null or ${table.offlineSince} >= ${table.releasedOn}`,
    ),
  ],
);

export const projectHighlights = pgTable("project_highlights", {
  id: id(),
  projectId: integer()
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  body: text().notNull(),
  featuredTitle: text(),
  position: position(),
  sourceId: integer()
    .notNull()
    .references(() => sources.id),
});

export const projectSkills = pgTable(
  "project_skills",
  {
    id: id(),
    projectId: integer()
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
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
    unique("project_skills_project_id_skill_id_unique").on(table.projectId, table.skillId),
  ],
);
