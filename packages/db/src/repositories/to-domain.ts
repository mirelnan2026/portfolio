import type { CaseStudySubject, Featured, MobileApp, Period, YearMonth } from "@mirelnan/domain";

/*
 * Pure functions that turn column values back into domain values: the reverse of what the seed
 * does when it writes. They know nothing about Drizzle, so the round-trip test covers them all.
 */

/** A `date` column ("2023-03-01") as a domain month ("2023-03"). */
export function toMonth(date: string): YearMonth;
export function toMonth(date: string | null): YearMonth | null;
export function toMonth(date: string | null): YearMonth | null {
  return date === null ? null : date.slice(0, 7);
}

export function toPeriod(startedOn: string, endedOn: string | null): Period {
  return { start: toMonth(startedOn), end: toMonth(endedOn) };
}

/**
 * `featured_title` and `featured_rank` as the domain's `featured`, or null when not featured. The seed writes both
 * or neither; a title without a rank means the seed has not run since the column was added.
 */
export function toFeatured(title: string | null, rank: number | null): Featured | null {
  if (title === null) {
    return null;
  }
  if (rank === null) {
    throw new Error(`Featured highlight "${title}" has no rank: run the seed`);
  }
  return { title, rank };
}

/** The two store columns as one `mobileApp`, which the domain allows only with at least one store. */
export function toMobileApp(appStore: string | null, playStore: string | null): MobileApp | null {
  return appStore === null && playStore === null ? null : { appStore, playStore };
}

/** The three nullable references back as the domain's union; the CHECK allows only these shapes. */
export function toCaseStudySubject(row: {
  experienceSlug: string | null;
  phaseSlug: string | null;
  projectSlug: string | null;
}): CaseStudySubject {
  if (row.experienceSlug !== null) {
    return { kind: "experience", experienceSlug: row.experienceSlug, phaseSlug: row.phaseSlug };
  }
  if (row.projectSlug !== null) {
    return { kind: "project", projectSlug: row.projectSlug };
  }
  throw new Error("A case study must be about an experience or a project");
}

/** Rows grouped by their parent's id, in the order they came (so `position` order is kept). */
export function groupBy<TRow>(rows: TRow[], parentId: (row: TRow) => number): Map<number, TRow[]> {
  const groups = new Map<number, TRow[]>();
  for (const row of rows) {
    const id = parentId(row);
    groups.set(id, [...(groups.get(id) ?? []), row]);
  }
  return groups;
}
