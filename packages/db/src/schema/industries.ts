import { pgTable, text, unique } from "drizzle-orm/pg-core";
import { id, slug } from "./columns";

export const industries = pgTable(
  "industries",
  {
    id: id(),
    slug: slug(),
    name: text().notNull(),
  },
  (table) => [unique().on(table.slug)],
);
