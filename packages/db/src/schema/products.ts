import { date, integer, pgTable, text, unique } from "drizzle-orm/pg-core";
import { id, slug } from "./columns";
import { industries } from "./industries";

/** Public product context, shown on the site only. Not a claim about the owner, so no `source_id`. */
export const products = pgTable(
  "products",
  {
    id: id(),
    slug: slug(),
    name: text().notNull(),
    url: text().notNull(),
    description: text().notNull(),
    industryId: integer()
      .notNull()
      .references(() => industries.id),
    sourceUrl: text().notNull(),
    retrievedOn: date({ mode: "string" }).notNull(),
  },
  (table) => [unique().on(table.slug)],
);
