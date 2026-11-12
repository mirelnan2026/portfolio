import type { Project, ProjectRepository } from "@mirelnan/domain";
import { asc, eq, inArray, type SQL } from "drizzle-orm";
import type { Database } from "../database";
import { projectHighlights, projects, projectSkills, skills, sources } from "../schema";
import { groupBy, toFeatured, toMobileApp, toMonth, toPeriod } from "./to-domain";

/** Reads whole Project aggregates: the roots, then their highlights and skills. */
async function loadProjects(db: Database, where?: SQL): Promise<Project[]> {
  const roots = await db
    .select({
      id: projects.id,
      slug: projects.slug,
      name: projects.name,
      summary: projects.summary,
      startedOn: projects.startedOn,
      endedOn: projects.endedOn,
      releasedOn: projects.releasedOn,
      offlineSince: projects.offlineSince,
      websiteUrl: projects.websiteUrl,
      repositoryUrl: projects.repositoryUrl,
      archiveUrl: projects.archiveUrl,
      appStoreUrl: projects.appStoreUrl,
      playStoreUrl: projects.playStoreUrl,
      sourceSlug: sources.slug,
    })
    .from(projects)
    .innerJoin(sources, eq(projects.sourceId, sources.id))
    .where(where)
    .orderBy(asc(projects.position));
  if (roots.length === 0) {
    return [];
  }
  const ids = roots.map((root) => root.id);

  const [highlights, skillUsages] = await Promise.all([
    db
      .select({
        projectId: projectHighlights.projectId,
        body: projectHighlights.body,
        featuredTitle: projectHighlights.featuredTitle,
        featuredRank: projectHighlights.featuredRank,
        sourceSlug: sources.slug,
      })
      .from(projectHighlights)
      .innerJoin(sources, eq(projectHighlights.sourceId, sources.id))
      .where(inArray(projectHighlights.projectId, ids))
      .orderBy(asc(projectHighlights.position)),
    db
      .select({
        projectId: projectSkills.projectId,
        skillSlug: skills.slug,
        contextNote: projectSkills.contextNote,
        sourceSlug: sources.slug,
      })
      .from(projectSkills)
      .innerJoin(skills, eq(projectSkills.skillId, skills.id))
      .innerJoin(sources, eq(projectSkills.sourceId, sources.id))
      .where(inArray(projectSkills.projectId, ids))
      .orderBy(asc(projectSkills.position)),
  ]);

  const highlightsOf = groupBy(highlights, (row) => row.projectId);
  const skillsOf = groupBy(skillUsages, (row) => row.projectId);

  return roots.map((root) => ({
    slug: root.slug,
    name: root.name,
    summary: root.summary,
    period: toPeriod(root.startedOn, root.endedOn),
    releasedOn: toMonth(root.releasedOn),
    offlineSince: toMonth(root.offlineSince),
    links: {
      website: root.websiteUrl,
      repository: root.repositoryUrl,
      archive: root.archiveUrl,
      mobileApp: toMobileApp(root.appStoreUrl, root.playStoreUrl),
    },
    highlights: (highlightsOf.get(root.id) ?? []).map((highlight) => ({
      body: highlight.body,
      featured: toFeatured(highlight.featuredTitle, highlight.featuredRank),
      sourceSlug: highlight.sourceSlug,
    })),
    skills: (skillsOf.get(root.id) ?? []).map((usage) => ({
      skillSlug: usage.skillSlug,
      contextNote: usage.contextNote,
      sourceSlug: usage.sourceSlug,
    })),
    sourceSlug: root.sourceSlug,
  }));
}

export function createDrizzleProjectRepository(db: Database): ProjectRepository {
  return {
    list: () => loadProjects(db),
    async getBySlug(slug) {
      const [project] = await loadProjects(db, eq(projects.slug, slug));
      return project ?? null;
    },
  };
}
