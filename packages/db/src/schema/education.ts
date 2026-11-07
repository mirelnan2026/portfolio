import { sql } from "drizzle-orm";
import { check, integer, pgTable, text, unique } from "drizzle-orm/pg-core";
import { id, position, slug } from "./columns";
import { sources } from "./sources";

export const education = pgTable(
  "education",
  {
    id: id(),
    slug: slug(),
    degree: text().notNull(),
    institution: text().notNull(),
    location: text().notNull(),
    startYear: integer().notNull(),
    endYear: integer().notNull(),
    position: position(),
    sourceId: integer()
      .notNull()
      .references(() => sources.id),
  },
  (table) => [
    unique().on(table.slug),
    check("education_years_check", sql`${table.endYear} >= ${table.startYear}`),
  ],
);
