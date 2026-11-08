import type { SkillRepository } from "@mirelnan/domain";
import { asc, eq } from "drizzle-orm";
import type { Database } from "../database";
import { skills, sources } from "../schema";

export function createDrizzleSkillRepository(db: Database): SkillRepository {
  return {
    list: () =>
      db
        .select({
          slug: skills.slug,
          name: skills.name,
          category: skills.category,
          sourceSlug: sources.slug,
        })
        .from(skills)
        .innerJoin(sources, eq(skills.sourceId, sources.id))
        .orderBy(asc(skills.position)),
  };
}
