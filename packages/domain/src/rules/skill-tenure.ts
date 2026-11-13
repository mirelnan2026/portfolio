import type { Experience } from "../entities/experience";
import type { Period } from "../values/period";
import { toMonthIndex, type YearMonth } from "../values/year-month";

/**
 * Months covered by a set of periods, each month counted once: overlapping or adjacent periods merge,
 * so two roles held at the same time add no extra time. An ongoing period runs to `currentMonth`.
 */
export function monthsCovered(periods: readonly Period[], currentMonth: YearMonth): number {
  const spans = periods
    .map((period): [number, number] => [
      toMonthIndex(period.start),
      toMonthIndex(period.end ?? currentMonth),
    ])
    .toSorted(([a], [b]) => a - b);

  const merged: [number, number][] = [];
  for (const [start, end] of spans) {
    const last = merged.at(-1);
    if (last !== undefined && start <= last[1] + 1) {
      last[1] = Math.max(last[1], end);
    } else {
      merged.push([start, end]);
    }
  }
  return merged.reduce((total, [start, end]) => total + end - start + 1, 0);
}

/** How long, and in which roles, a skill was used. */
export interface SkillTenure {
  /** Months covered by the roles (or phases) that used it, each month once. */
  months: number;
  /** The experiences that used it, in the order given (newest first in cv-data). */
  experienceSlugs: string[];
}

/**
 * Tenure per skill, from the experiences' skill links: a link with a phase counts the phase's period,
 * otherwise the experience's. Keyed by skill slug; a skill no experience uses is absent.
 */
export function skillTenure(
  experiences: readonly Experience[],
  currentMonth: YearMonth,
): Map<string, SkillTenure> {
  const usage = new Map<string, { periods: Period[]; experienceSlugs: string[] }>();
  for (const experience of experiences) {
    for (const link of experience.skills) {
      const phase = experience.phases.find((candidate) => candidate.slug === link.phaseSlug);
      const entry = usage.get(link.skillSlug) ?? { periods: [], experienceSlugs: [] };
      entry.periods.push(phase?.period ?? experience.period);
      if (!entry.experienceSlugs.includes(experience.slug))
        entry.experienceSlugs.push(experience.slug);
      usage.set(link.skillSlug, entry);
    }
  }
  return new Map(
    [...usage].map(([slug, { periods, experienceSlugs }]) => [
      slug,
      { months: monthsCovered(periods, currentMonth), experienceSlugs },
    ]),
  );
}
