import { type CvData, cvDataSchema } from "@mirelnan/domain";
import { sql } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";
import type { Database, Transaction } from "../database";
import * as tables from "../schema";

/** Every table, so one TRUNCATE empties the database before the snapshot is written again. */
const allTables = [
  tables.caseStudySkills,
  tables.caseStudies,
  tables.projectSkills,
  tables.projectHighlights,
  tables.projects,
  tables.experienceProducts,
  tables.experienceSkills,
  tables.experienceHighlights,
  tables.experiencePhases,
  tables.experiences,
  tables.languages,
  tables.education,
  tables.profiles,
  tables.products,
  tables.skills,
  tables.industries,
  tables.sources,
];

/** A domain month ("2023-03") as the first day of that month, the way a `date` column stores it. */
function toDate(month: string): string;
function toDate(month: string | null): string | null;
function toDate(month: string | null): string | null {
  return month === null ? null : `${month}-01`;
}

/** Looks up the database id of a slug; an unknown slug is a bug in the data, so it throws. */
function idsBySlug(entity: string, rows: { id: number; slug: string }[]) {
  const ids = new Map(rows.map((row) => [row.slug, row.id]));
  return (slug: string): number => {
    const id = ids.get(slug);
    if (id === undefined) {
      throw new Error(`Unknown ${entity} "${slug}"`);
    }
    return id;
  };
}

/** The id stored under `key`; a missing key is a bug in the data, so it throws. */
function required(ids: Map<string, number>, key: string): number {
  const id = ids.get(key);
  if (id === undefined) {
    throw new Error(`Unknown reference "${key}"`);
  }
  return id;
}

/** Drizzle rejects an insert with no rows, so an empty list is skipped. */
async function insertRows<TTable extends PgTable>(
  tx: Transaction,
  table: TTable,
  rows: TTable["$inferInsert"][],
): Promise<void> {
  if (rows.length > 0) {
    await tx.insert(table).values(rows);
  }
}

/**
 * Replaces everything in the database with this CV snapshot, in one transaction.
 * `cv-data` is the source of truth and the database is a copy of it, so the seed empties the
 * tables and writes them again: running it twice gives the same rows, with the same ids.
 */
export async function writeCvData(db: Database, input: CvData): Promise<void> {
  const data = cvDataSchema.parse(input);

  await db.transaction(async (tx) => {
    await tx.execute(sql`truncate table ${sql.join(allTables, sql`, `)} restart identity cascade`);

    // Reference data: the records the aggregates point to.
    await insertRows(tx, tables.sources, data.sources);
    const sourceId = idsBySlug(
      "source",
      await tx.select({ id: tables.sources.id, slug: tables.sources.slug }).from(tables.sources),
    );

    await insertRows(tx, tables.industries, data.industries);
    const industryId = idsBySlug(
      "industry",
      await tx
        .select({ id: tables.industries.id, slug: tables.industries.slug })
        .from(tables.industries),
    );

    await insertRows(
      tx,
      tables.skills,
      data.skills.map(({ sourceSlug, ...skill }, position) => ({
        ...skill,
        position,
        sourceId: sourceId(sourceSlug),
      })),
    );
    const skillId = idsBySlug(
      "skill",
      await tx.select({ id: tables.skills.id, slug: tables.skills.slug }).from(tables.skills),
    );

    await insertRows(
      tx,
      tables.products,
      data.products.map(({ industrySlug, ...product }) => ({
        ...product,
        industryId: industryId(industrySlug),
      })),
    );
    const productId = idsBySlug(
      "product",
      await tx.select({ id: tables.products.id, slug: tables.products.slug }).from(tables.products),
    );

    // Simple records.
    const { sourceSlug: profileSource, ...profile } = data.profile;
    await tx.insert(tables.profiles).values({ ...profile, sourceId: sourceId(profileSource) });

    await insertRows(
      tx,
      tables.education,
      data.education.map(({ sourceSlug, ...entry }, position) => ({
        ...entry,
        position,
        sourceId: sourceId(sourceSlug),
      })),
    );

    await insertRows(
      tx,
      tables.languages,
      data.languages.map(({ sourceSlug, ...language }, position) => ({
        ...language,
        position,
        sourceId: sourceId(sourceSlug),
      })),
    );

    // Aggregates: the root first, for its id, then one table per list.
    const experienceIds = new Map<string, number>();
    const phaseIds = new Map<string, number>();

    for (const [position, experience] of data.experiences.entries()) {
      const [root] = await tx
        .insert(tables.experiences)
        .values({
          slug: experience.slug,
          company: experience.company,
          role: experience.role,
          employmentType: experience.employmentType,
          workMode: experience.workMode,
          location: experience.location,
          startedOn: toDate(experience.period.start),
          endedOn: toDate(experience.period.end),
          position,
          sourceId: sourceId(experience.sourceSlug),
        })
        .returning({ id: tables.experiences.id });
      if (root === undefined) {
        throw new Error(`Experience "${experience.slug}" was not inserted`);
      }
      const experienceId = root.id;
      experienceIds.set(experience.slug, experienceId);

      /** Phase slugs are unique only within their experience, so the key includes both. */
      const phaseId = (phaseSlug: string | null): number | null => {
        if (phaseSlug === null) {
          return null;
        }
        return required(phaseIds, `${experience.slug}/${phaseSlug}`);
      };

      for (const [phasePosition, phase] of experience.phases.entries()) {
        const [row] = await tx
          .insert(tables.experiencePhases)
          .values({
            experienceId,
            slug: phase.slug,
            title: phase.title,
            startedOn: toDate(phase.period.start),
            endedOn: toDate(phase.period.end),
            industryId: industryId(phase.industrySlug),
            summary: phase.summary,
            position: phasePosition,
            sourceId: sourceId(phase.sourceSlug),
          })
          .returning({ id: tables.experiencePhases.id });
        if (row === undefined) {
          throw new Error(`Phase "${phase.slug}" was not inserted`);
        }
        phaseIds.set(`${experience.slug}/${phase.slug}`, row.id);
      }

      await insertRows(
        tx,
        tables.experienceHighlights,
        experience.highlights.map((highlight, highlightPosition) => ({
          experienceId,
          phaseId: phaseId(highlight.phaseSlug),
          body: highlight.body,
          ownership: highlight.ownership,
          featuredTitle: highlight.featured?.title ?? null,
          position: highlightPosition,
          sourceId: sourceId(highlight.sourceSlug),
        })),
      );

      await insertRows(
        tx,
        tables.experienceSkills,
        experience.skills.map((usage, usagePosition) => ({
          experienceId,
          phaseId: phaseId(usage.phaseSlug),
          skillId: skillId(usage.skillSlug),
          contextNote: usage.contextNote,
          position: usagePosition,
          sourceId: sourceId(usage.sourceSlug),
        })),
      );

      await insertRows(
        tx,
        tables.experienceProducts,
        experience.products.map((link, linkPosition) => ({
          experienceId,
          phaseId: phaseId(link.phaseSlug),
          productId: productId(link.productSlug),
          position: linkPosition,
        })),
      );
    }

    const projectIds = new Map<string, number>();

    for (const [position, project] of data.projects.entries()) {
      const [root] = await tx
        .insert(tables.projects)
        .values({
          slug: project.slug,
          name: project.name,
          summary: project.summary,
          startedOn: toDate(project.period.start),
          endedOn: toDate(project.period.end),
          releasedOn: toDate(project.releasedOn),
          offlineSince: toDate(project.offlineSince),
          websiteUrl: project.links.website,
          repositoryUrl: project.links.repository,
          archiveUrl: project.links.archive,
          appStoreUrl: project.links.mobileApp?.appStore ?? null,
          playStoreUrl: project.links.mobileApp?.playStore ?? null,
          position,
          sourceId: sourceId(project.sourceSlug),
        })
        .returning({ id: tables.projects.id });
      if (root === undefined) {
        throw new Error(`Project "${project.slug}" was not inserted`);
      }
      projectIds.set(project.slug, root.id);

      await insertRows(
        tx,
        tables.projectHighlights,
        project.highlights.map((highlight, highlightPosition) => ({
          projectId: root.id,
          body: highlight.body,
          featuredTitle: highlight.featured?.title ?? null,
          position: highlightPosition,
          sourceId: sourceId(highlight.sourceSlug),
        })),
      );

      await insertRows(
        tx,
        tables.projectSkills,
        project.skills.map((usage, usagePosition) => ({
          projectId: root.id,
          skillId: skillId(usage.skillSlug),
          contextNote: usage.contextNote,
          position: usagePosition,
          sourceId: sourceId(usage.sourceSlug),
        })),
      );
    }

    for (const [position, caseStudy] of data.caseStudies.entries()) {
      const { about } = caseStudy;
      const [root] = await tx
        .insert(tables.caseStudies)
        .values({
          slug: caseStudy.slug,
          title: caseStudy.title,
          context: caseStudy.context,
          approach: caseStudy.approach,
          outcome: caseStudy.outcome,
          whatItShows: caseStudy.whatItShows,
          experienceId:
            about.kind === "experience" ? required(experienceIds, about.experienceSlug) : null,
          phaseId:
            about.kind === "experience" && about.phaseSlug !== null
              ? required(phaseIds, `${about.experienceSlug}/${about.phaseSlug}`)
              : null,
          projectId: about.kind === "project" ? required(projectIds, about.projectSlug) : null,
          url: caseStudy.url,
          position,
          sourceId: sourceId(caseStudy.sourceSlug),
        })
        .returning({ id: tables.caseStudies.id });
      if (root === undefined) {
        throw new Error(`Case study "${caseStudy.slug}" was not inserted`);
      }

      await insertRows(
        tx,
        tables.caseStudySkills,
        caseStudy.skillSlugs.map((slug, skillPosition) => ({
          caseStudyId: root.id,
          skillId: skillId(slug),
          position: skillPosition,
        })),
      );
    }
  });
}
