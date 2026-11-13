import type { Experience, SkillUsage, YearMonth } from "@mirelnan/domain";
import { monthsBetween } from "@mirelnan/domain";

/** Roles that ended this many years before the current month are grouped as "Earlier experience". */
export const earlierAfterYears = 10;

/** The timeline in two parts: recent roles in full, and older ones grouped behind a disclosure. */
export function splitByAge(
  experiences: Experience[],
  currentMonth: YearMonth,
): { recent: Experience[]; earlier: Experience[] } {
  const isEarlier = (experience: Experience) =>
    experience.period.end !== null &&
    monthsBetween(experience.period.end, currentMonth) > earlierAfterYears * 12;
  return {
    recent: experiences.filter((experience) => !isEarlier(experience)),
    earlier: experiences.filter(isEarlier),
  };
}

/**
 * The skills shown as badges on a role: the CV's own "Technologies" line and what the brief adds. The full list
 * from the skills matrix stays in the data (years per skill, the skill filter), not on the card.
 */
export function cardSkills(experience: Experience): SkillUsage[] {
  return experience.skills.filter((usage) => usage.sourceSlug !== "skills-matrix");
}
