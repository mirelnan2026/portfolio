import type { LanguageRepository } from "@mirelnan/domain";
import { asc, eq } from "drizzle-orm";
import type { Database } from "../database";
import { languages, sources } from "../schema";

export function createDrizzleLanguageRepository(db: Database): LanguageRepository {
  return {
    list: () =>
      db
        .select({
          code: languages.code,
          name: languages.name,
          proficiency: languages.proficiency,
          cefrLevel: languages.cefrLevel,
          sourceSlug: sources.slug,
        })
        .from(languages)
        .innerJoin(sources, eq(languages.sourceId, sources.id))
        .orderBy(asc(languages.position)),
  };
}
