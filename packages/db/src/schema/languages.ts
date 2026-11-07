import { cefrLevelSchema } from "@mirelnan/domain";
import { integer, pgEnum, pgTable, text, unique } from "drizzle-orm/pg-core";
import { id, position } from "./columns";
import { sources } from "./sources";

export const cefrLevel = pgEnum("cefr_level", cefrLevelSchema.enum);

export const languages = pgTable(
  "languages",
  {
    id: id(),
    /** ISO 639-1 code: the domain identity of a language. */
    code: text().notNull(),
    name: text().notNull(),
    proficiency: text().notNull(),
    cefrLevel: cefrLevel(),
    position: position(),
    sourceId: integer()
      .notNull()
      .references(() => sources.id),
  },
  (table) => [unique().on(table.code)],
);
