import type { Experience, Skill, SkillCategory, YearMonth } from "@mirelnan/domain";
import { skillTenure } from "@mirelnan/domain";

/** The group names of the CV's "Technical skills". */
const categoryNames: Record<SkillCategory, string> = {
  frontend: "Frontend",
  "ui-libraries": "UI libraries",
  "backend-and-data": "Backend and data",
  "testing-and-tooling": "Testing and tooling",
  cloud: "Cloud",
  "ai-assisted-development": "AI-assisted development",
  practices: "Practices",
};

export interface SkillItem {
  slug: string;
  name: string;
  /** Months covered by the roles that used it, each month once. */
  months: number;
}

export interface SkillGroup {
  category: SkillCategory;
  name: string;
  skills: SkillItem[];
}

/**
 * The skills by category. `skills` comes most important first, so each group keeps that order, and the
 * groups follow their most important skill (a Map keeps insertion order).
 */
export function skillGroups(
  skills: Skill[],
  experiences: Experience[],
  currentMonth: YearMonth,
): SkillGroup[] {
  const tenure = skillTenure(experiences, currentMonth);
  const groups = new Map<SkillCategory, SkillGroup>();
  for (const skill of skills) {
    const usage = tenure.get(skill.slug);
    if (usage === undefined) {
      continue; // a cv-data test keeps every skill linked; an unlinked one has no years to show
    }
    const group = groups.get(skill.category) ?? {
      category: skill.category,
      name: categoryNames[skill.category],
      skills: [],
    };
    group.skills.push({ slug: skill.slug, name: skill.name, months: usage.months });
    groups.set(skill.category, group);
  }
  return [...groups.values()];
}
