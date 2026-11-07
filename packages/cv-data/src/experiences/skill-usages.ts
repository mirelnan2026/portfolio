import type { SkillUsage } from "@mirelnan/domain";

/** Skills used across a whole experience, with no context note (the "Technologies" line of a role). */
export function usedSkills(sourceSlug: string, skillSlugs: string[]): SkillUsage[] {
  return skillSlugs.map((skillSlug) => ({
    skillSlug,
    phaseSlug: null,
    contextNote: null,
    sourceSlug,
  }));
}
