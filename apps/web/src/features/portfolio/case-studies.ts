import type { CaseStudy, Experience, Skill } from "@mirelnan/domain";
import { yearRange } from "./format";

/** What a case study is about, as a link to its role in the timeline. */
export interface CaseStudySubject {
  /** "JWP Connatix". */
  label: string;
  /** "#experience-jwp-connatix". */
  href: string;
  /** "Content management suite · 2023–2024": the phase and its years, or the role's years. */
  period: string;
}

/** One case study as the page shows it. */
export interface CaseStudyCard {
  slug: string;
  title: string;
  context: string;
  approach: string;
  outcome: string;
  whatItShows: string;
  /** Null for a personal project: projects are not on the page yet. */
  subject: CaseStudySubject | null;
  skills: string[];
}

function subjectOf(caseStudy: CaseStudy, experiences: Experience[]): CaseStudySubject | null {
  if (caseStudy.about.kind !== "experience") {
    return null;
  }
  const { experienceSlug, phaseSlug } = caseStudy.about;
  const experience = experiences.find((candidate) => candidate.slug === experienceSlug);
  if (experience === undefined) {
    return null;
  }
  const phase = experience.phases.find((candidate) => candidate.slug === phaseSlug);
  return {
    label: experience.company,
    href: `#experience-${experience.slug}`,
    period:
      phase === undefined
        ? yearRange(experience.period)
        : `${phase.title} · ${yearRange(phase.period)}`,
  };
}

/** The case studies in the data's order, each linked to the role (and phase) it is about. */
export function caseStudyCards(
  caseStudies: CaseStudy[],
  experiences: Experience[],
  skills: Skill[],
): CaseStudyCard[] {
  const skillNames = new Map(skills.map((skill) => [skill.slug, skill.name]));
  return caseStudies.map((caseStudy) => ({
    slug: caseStudy.slug,
    title: caseStudy.title,
    context: caseStudy.context,
    approach: caseStudy.approach,
    outcome: caseStudy.outcome,
    whatItShows: caseStudy.whatItShows,
    subject: subjectOf(caseStudy, experiences),
    skills: caseStudy.skillSlugs.flatMap((slug) => skillNames.get(slug) ?? []),
  }));
}
