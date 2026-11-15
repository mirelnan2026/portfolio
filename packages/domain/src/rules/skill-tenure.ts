import type { Experience } from "../entities/experience";
import type { Project } from "../entities/project";
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

/** How long, and where, a skill was used. */
export interface SkillTenure {
  /** Months covered by the roles (or phases) and the projects that used it, each month once. */
  months: number;
  /** The experiences that used it, in the order given (newest first in cv-data). */
  experienceSlugs: string[];
  /** The personal projects that used it, in the order given. */
  projectSlugs: string[];
}

interface Usage {
  periods: Period[];
  experienceSlugs: string[];
  projectSlugs: string[];
}

/**
 * Tenure per skill, from the skill links of the experiences and the personal projects: a role's link with a
 * phase counts the phase's period, otherwise the experience's; a project's link counts the project's period.
 * Keyed by skill slug; a skill nothing uses is absent.
 */
export function skillTenure(
  experiences: readonly Experience[],
  projects: readonly Project[],
  currentMonth: YearMonth,
): Map<string, SkillTenure> {
  const usage = new Map<string, Usage>();
  const usageOf = (skillSlug: string): Usage => {
    const entry = usage.get(skillSlug) ?? { periods: [], experienceSlugs: [], projectSlugs: [] };
    usage.set(skillSlug, entry);
    return entry;
  };

  for (const experience of experiences) {
    for (const link of experience.skills) {
      const phase = experience.phases.find((candidate) => candidate.slug === link.phaseSlug);
      const entry = usageOf(link.skillSlug);
      entry.periods.push(phase?.period ?? experience.period);
      if (!entry.experienceSlugs.includes(experience.slug)) {
        entry.experienceSlugs.push(experience.slug);
      }
    }
  }

  for (const project of projects) {
    for (const link of project.skills) {
      const entry = usageOf(link.skillSlug);
      entry.periods.push(project.period);
      if (!entry.projectSlugs.includes(project.slug)) {
        entry.projectSlugs.push(project.slug);
      }
    }
  }

  return new Map(
    [...usage].map(([slug, { periods, experienceSlugs, projectSlugs }]) => [
      slug,
      { months: monthsCovered(periods, currentMonth), experienceSlugs, projectSlugs },
    ]),
  );
}
