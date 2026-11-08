import type { SourceRepository } from "@mirelnan/domain";
import { asc } from "drizzle-orm";
import type { Database } from "../database";
import { sources } from "../schema";

export function createDrizzleSourceRepository(db: Database): SourceRepository {
  return {
    // No position column: the seed inserts in cv-data order, so the id is the display order.
    list: () =>
      db
        .select({ slug: sources.slug, kind: sources.kind, title: sources.title })
        .from(sources)
        .orderBy(asc(sources.id)),
  };
}
