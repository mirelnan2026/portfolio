import type { SkillUsage } from "@mirelnan/domain";

/**
 * Skills from one source with no context note: a role's "Technologies" line (`"cv"`) or the rest of
 * its row in the skills matrix (`"skills-matrix"`). A phase narrows them to that part of the role.
 */
export function usedSkills(
  sourceSlug: string,
  skillSlugs: string[],
  phaseSlug: string | null = null,
): SkillUsage[] {
  return skillSlugs.map((skillSlug) => ({ skillSlug, phaseSlug, contextNote: null, sourceSlug }));
}
