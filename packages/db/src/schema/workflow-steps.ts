import { integer, pgTable, text, unique } from "drizzle-orm/pg-core";
import { id, position, slug } from "./columns";
import { sources } from "./sources";

export const workflowSteps = pgTable(
  "workflow_steps",
  {
    id: id(),
    slug: slug(),
    title: text().notNull(),
    body: text().notNull(),
    position: position(),
    sourceId: integer()
      .notNull()
      .references(() => sources.id),
  },
  (table) => [unique().on(table.slug)],
);
