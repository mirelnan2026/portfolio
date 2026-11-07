import { sourceKindSchema } from "@mirelnan/domain";
import { pgEnum, pgTable, text, unique } from "drizzle-orm/pg-core";
import { id, slug } from "./columns";

export const sourceKind = pgEnum("source_kind", sourceKindSchema.enum);

/** Approved documents. Every row that makes a claim about the owner points here with `source_id`. */
export const sources = pgTable(
  "sources",
  {
    id: id(),
    slug: slug(),
    kind: sourceKind().notNull(),
    title: text().notNull(),
  },
  (table) => [unique().on(table.slug)],
);
