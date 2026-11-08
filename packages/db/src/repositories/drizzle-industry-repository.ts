import type { IndustryRepository } from "@mirelnan/domain";
import { asc } from "drizzle-orm";
import type { Database } from "../database";
import { industries } from "../schema";

export function createDrizzleIndustryRepository(db: Database): IndustryRepository {
  return {
    list: () =>
      db
        .select({ slug: industries.slug, name: industries.name })
        .from(industries)
        .orderBy(asc(industries.id)),
  };
}
