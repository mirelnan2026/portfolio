import type { Experience, ExperienceRepository } from "@mirelnan/domain";
import { asc, eq, inArray, type SQL } from "drizzle-orm";
import type { Database } from "../database";
import {
  experienceHighlights,
  experiencePhases,
  experienceProducts,
  experiences,
  experienceSkills,
  industries,
  products,
  skills,
  sources,
} from "../schema";
import { groupBy, toFeatured, toPeriod } from "./to-domain";

/**
 * Reads whole Experience aggregates: one query for the roots, then one per list, all filtered to
 * those roots. A part's phase comes back as its slug through a left join (no phase = whole experience).
 */
async function loadExperiences(db: Database, where?: SQL): Promise<Experience[]> {
  const roots = await db
    .select({
      id: experiences.id,
      slug: experiences.slug,
      company: experiences.company,
      role: experiences.role,
      employmentType: experiences.employmentType,
      workMode: experiences.workMode,
      location: experiences.location,
      startedOn: experiences.startedOn,
      endedOn: experiences.endedOn,
      sourceSlug: sources.slug,
    })
    .from(experiences)
    .innerJoin(sources, eq(experiences.sourceId, sources.id))
    .where(where)
    .orderBy(asc(experiences.position));
  if (roots.length === 0) {
    return [];
  }
  const ids = roots.map((root) => root.id);

  const [phases, highlights, skillUsages, productLinks] = await Promise.all([
    db
      .select({
        experienceId: experiencePhases.experienceId,
        slug: experiencePhases.slug,
        title: experiencePhases.title,
        startedOn: experiencePhases.startedOn,
        endedOn: experiencePhases.endedOn,
        industrySlug: industries.slug,
        summary: experiencePhases.summary,
        sourceSlug: sources.slug,
      })
      .from(experiencePhases)
      .innerJoin(industries, eq(experiencePhases.industryId, industries.id))
      .innerJoin(sources, eq(experiencePhases.sourceId, sources.id))
      .where(inArray(experiencePhases.experienceId, ids))
      .orderBy(asc(experiencePhases.position)),
    db
      .select({
        experienceId: experienceHighlights.experienceId,
        body: experienceHighlights.body,
        ownership: experienceHighlights.ownership,
        featuredTitle: experienceHighlights.featuredTitle,
        phaseSlug: experiencePhases.slug,
        sourceSlug: sources.slug,
      })
      .from(experienceHighlights)
      .leftJoin(experiencePhases, eq(experienceHighlights.phaseId, experiencePhases.id))
      .innerJoin(sources, eq(experienceHighlights.sourceId, sources.id))
      .where(inArray(experienceHighlights.experienceId, ids))
      .orderBy(asc(experienceHighlights.position)),
    db
      .select({
        experienceId: experienceSkills.experienceId,
        skillSlug: skills.slug,
        phaseSlug: experiencePhases.slug,
        contextNote: experienceSkills.contextNote,
        sourceSlug: sources.slug,
      })
      .from(experienceSkills)
      .innerJoin(skills, eq(experienceSkills.skillId, skills.id))
      .leftJoin(experiencePhases, eq(experienceSkills.phaseId, experiencePhases.id))
      .innerJoin(sources, eq(experienceSkills.sourceId, sources.id))
      .where(inArray(experienceSkills.experienceId, ids))
      .orderBy(asc(experienceSkills.position)),
    db
      .select({
        experienceId: experienceProducts.experienceId,
        productSlug: products.slug,
        phaseSlug: experiencePhases.slug,
      })
      .from(experienceProducts)
      .innerJoin(products, eq(experienceProducts.productId, products.id))
      .leftJoin(experiencePhases, eq(experienceProducts.phaseId, experiencePhases.id))
      .where(inArray(experienceProducts.experienceId, ids))
      .orderBy(asc(experienceProducts.position)),
  ]);

  const phasesOf = groupBy(phases, (row) => row.experienceId);
  const highlightsOf = groupBy(highlights, (row) => row.experienceId);
  const skillsOf = groupBy(skillUsages, (row) => row.experienceId);
  const productsOf = groupBy(productLinks, (row) => row.experienceId);

  return roots.map((root) => ({
    slug: root.slug,
    company: root.company,
    role: root.role,
    employmentType: root.employmentType,
    workMode: root.workMode,
    location: root.location,
    period: toPeriod(root.startedOn, root.endedOn),
    phases: (phasesOf.get(root.id) ?? []).map((phase) => ({
      slug: phase.slug,
      title: phase.title,
      period: toPeriod(phase.startedOn, phase.endedOn),
      industrySlug: phase.industrySlug,
      summary: phase.summary,
      sourceSlug: phase.sourceSlug,
    })),
    highlights: (highlightsOf.get(root.id) ?? []).map((highlight) => ({
      body: highlight.body,
      ownership: highlight.ownership,
      featured: toFeatured(highlight.featuredTitle),
      phaseSlug: highlight.phaseSlug,
      sourceSlug: highlight.sourceSlug,
    })),
    skills: (skillsOf.get(root.id) ?? []).map((usage) => ({
      skillSlug: usage.skillSlug,
      phaseSlug: usage.phaseSlug,
      contextNote: usage.contextNote,
      sourceSlug: usage.sourceSlug,
    })),
    products: (productsOf.get(root.id) ?? []).map((link) => ({
      productSlug: link.productSlug,
      phaseSlug: link.phaseSlug,
    })),
    sourceSlug: root.sourceSlug,
  }));
}

export function createDrizzleExperienceRepository(db: Database): ExperienceRepository {
  return {
    list: () => loadExperiences(db),
    async getBySlug(slug) {
      const [experience] = await loadExperiences(db, eq(experiences.slug, slug));
      return experience ?? null;
    },
  };
}
