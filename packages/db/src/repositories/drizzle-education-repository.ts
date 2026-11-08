import type { EducationRepository } from "@mirelnan/domain";
import { asc, eq } from "drizzle-orm";
import type { Database } from "../database";
import { education, sources } from "../schema";

export function createDrizzleEducationRepository(db: Database): EducationRepository {
  return {
    list: () =>
      db
        .select({
          slug: education.slug,
          degree: education.degree,
          institution: education.institution,
          location: education.location,
          startYear: education.startYear,
          endYear: education.endYear,
          sourceSlug: sources.slug,
        })
        .from(education)
        .innerJoin(sources, eq(education.sourceId, sources.id))
        .orderBy(asc(education.position)),
  };
}
