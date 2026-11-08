import type { CaseStudy, CaseStudyRepository } from "@mirelnan/domain";
import { asc, eq, inArray, type SQL } from "drizzle-orm";
import type { Database } from "../database";
import {
  caseStudies,
  caseStudySkills,
  experiencePhases,
  experiences,
  projects,
  skills,
  sources,
} from "../schema";
import { groupBy, toCaseStudySubject } from "./to-domain";

/** Reads case studies with what they are about (as slugs) and their skill tags. */
async function loadCaseStudies(db: Database, where?: SQL): Promise<CaseStudy[]> {
  const roots = await db
    .select({
      id: caseStudies.id,
      slug: caseStudies.slug,
      title: caseStudies.title,
      context: caseStudies.context,
      approach: caseStudies.approach,
      outcome: caseStudies.outcome,
      whatItShows: caseStudies.whatItShows,
      experienceSlug: experiences.slug,
      phaseSlug: experiencePhases.slug,
      projectSlug: projects.slug,
      url: caseStudies.url,
      sourceSlug: sources.slug,
    })
    .from(caseStudies)
    .leftJoin(experiences, eq(caseStudies.experienceId, experiences.id))
    .leftJoin(experiencePhases, eq(caseStudies.phaseId, experiencePhases.id))
    .leftJoin(projects, eq(caseStudies.projectId, projects.id))
    .innerJoin(sources, eq(caseStudies.sourceId, sources.id))
    .where(where)
    .orderBy(asc(caseStudies.position));
  if (roots.length === 0) {
    return [];
  }
  const ids = roots.map((root) => root.id);

  const tags = await db
    .select({ caseStudyId: caseStudySkills.caseStudyId, skillSlug: skills.slug })
    .from(caseStudySkills)
    .innerJoin(skills, eq(caseStudySkills.skillId, skills.id))
    .where(inArray(caseStudySkills.caseStudyId, ids))
    .orderBy(asc(caseStudySkills.position));
  const tagsOf = groupBy(tags, (row) => row.caseStudyId);

  return roots.map((root) => ({
    slug: root.slug,
    title: root.title,
    context: root.context,
    approach: root.approach,
    outcome: root.outcome,
    whatItShows: root.whatItShows,
    about: toCaseStudySubject(root),
    url: root.url,
    skillSlugs: (tagsOf.get(root.id) ?? []).map((tag) => tag.skillSlug),
    sourceSlug: root.sourceSlug,
  }));
}

export function createDrizzleCaseStudyRepository(db: Database): CaseStudyRepository {
  return {
    list: () => loadCaseStudies(db),
    async getBySlug(slug) {
      const [caseStudy] = await loadCaseStudies(db, eq(caseStudies.slug, slug));
      return caseStudy ?? null;
    },
  };
}
