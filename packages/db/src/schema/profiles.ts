import { integer, pgTable, text } from "drizzle-orm/pg-core";
import { id } from "./columns";
import { sources } from "./sources";

/** The owner's public profile: one row. There is no phone column, on purpose. */
export const profiles = pgTable("profiles", {
  id: id(),
  name: text().notNull(),
  headline: text().notNull(),
  intro: text().notNull(),
  summary: text().notNull(),
  location: text().notNull(),
  availability: text().notNull(),
  email: text().notNull(),
  linkedinUrl: text().notNull(),
  interests: text().array().notNull(),
  sourceId: integer()
    .notNull()
    .references(() => sources.id),
});
