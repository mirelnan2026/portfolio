import type { Experience, Skill, SkillCategory, YearMonth } from "@mirelnan/domain";
import { skillTenure } from "@mirelnan/domain";
import { yearRange } from "./format";

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

/** A role that used a skill, as the "Where it was used" panel lists it. */
export interface SkillRole {
  experienceSlug: string;
  company: string;
  /** The phase's title when the skill was used in one phase only, otherwise null. */
  phase: string | null;
  /** "2025–2026": the phase's years when there is one, otherwise the role's. */
  years: string;
}

export interface SkillItem {
  slug: string;
  name: string;
  /** Months covered by the roles that used it, each month once. */
  months: number;
  /** The roles that used it, newest first. */
  roles: SkillRole[];
  /** The sources' notes on how it was used, from the skill links. */
  notes: string[];
}

export interface SkillGroup {
  category: SkillCategory;
  name: string;
  skills: SkillItem[];
}

/** One role in a skill's panel: a link with a phase names the phase and its years. */
function skillRole(experience: Experience, skillSlug: string): SkillRole {
  const link = experience.skills.find((candidate) => candidate.skillSlug === skillSlug);
  const phase = experience.phases.find((candidate) => candidate.slug === link?.phaseSlug);
  return {
    experienceSlug: experience.slug,
    company: experience.company,
    phase: phase?.title ?? null,
    years: yearRange(phase?.period ?? experience.period),
  };
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
  const bySlug = new Map(experiences.map((experience) => [experience.slug, experience]));
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
    group.skills.push({
      slug: skill.slug,
      name: skill.name,
      months: usage.months,
      roles: usage.experienceSlugs.flatMap((slug) => {
        const experience = bySlug.get(slug);
        return experience === undefined ? [] : [skillRole(experience, skill.slug)];
      }),
      notes: experiences.flatMap((experience) =>
        experience.skills.flatMap((link) =>
          link.skillSlug === skill.slug && link.contextNote !== null ? [link.contextNote] : [],
        ),
      ),
    });
    groups.set(skill.category, group);
  }
  return [...groups.values()];
}

/** The page's query string after a skill is pressed: it selects the skill, or clears it when already selected. */
export function toggledSkillSearch(search: string, slug: string): string {
  const params = new URLSearchParams(search);
  if (params.get("skill") === slug) {
    params.delete("skill");
  } else {
    params.set("skill", slug);
  }
  const query = params.toString();
  return query === "" ? "" : `?${query}`;
}

/** The skill a query string selects; an unknown slug selects nothing. */
export function selectedSkill(groups: SkillGroup[], slug: string | null): SkillItem | null {
  return groups.flatMap((group) => group.skills).find((skill) => skill.slug === slug) ?? null;
}

/** The most important skills, in the owner's ranking (`skills` comes most important first). */
export function topSkills(groups: SkillGroup[], skills: Skill[], count: number): SkillItem[] {
  const items = new Map(groups.flatMap((group) => group.skills).map((item) => [item.slug, item]));
  return skills.flatMap((skill) => items.get(skill.slug) ?? []).slice(0, count);
}
