import { skillCategorySchema } from "@mirelnan/domain";
import { integer, pgEnum, pgTable, text, unique } from "drizzle-orm/pg-core";
import { id, position, slug } from "./columns";
import { sources } from "./sources";

export const skillCategory = pgEnum("skill_category", skillCategorySchema.enum);

export const skills = pgTable(
  "skills",
  {
    id: id(),
    slug: slug(),
    name: text().notNull(),
    category: skillCategory().notNull(),
    position: position(),
    sourceId: integer()
      .notNull()
      .references(() => sources.id),
  },
  (table) => [unique().on(table.slug)],
);
