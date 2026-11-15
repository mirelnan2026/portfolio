import type { CaseStudy, Experience, Project, Skill } from "@mirelnan/domain";
import { yearRange } from "./format";

/** What a case study is about: its role in the timeline, or a personal project. */
export interface CaseStudySubject {
  /** "JWP Connatix", or a project's name. */
  label: string;
  /** "#experience-jwp-connatix"; null for a personal project, since the page has no projects section to link to. */
  href: string | null;
  /** "Content management suite · 2023–2024", the role's years, or "Personal project · 2026–present". */
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
  /** Null only when the role or project it is about is missing. */
  subject: CaseStudySubject | null;
  skills: string[];
}

function subjectOf(
  caseStudy: CaseStudy,
  experiences: Experience[],
  projects: Project[],
): CaseStudySubject | null {
  const { about } = caseStudy;
  if (about.kind === "project") {
    const project = projects.find((candidate) => candidate.slug === about.projectSlug);
    return project === undefined
      ? null
      : {
          label: project.name,
          href: null,
          period: `Personal project · ${yearRange(project.period)}`,
        };
  }
  const experience = experiences.find((candidate) => candidate.slug === about.experienceSlug);
  if (experience === undefined) {
    return null;
  }
  const phase = experience.phases.find((candidate) => candidate.slug === about.phaseSlug);
  return {
    label: experience.company,
    href: `#experience-${experience.slug}`,
    period:
      phase === undefined
        ? yearRange(experience.period)
        : `${phase.title} · ${yearRange(phase.period)}`,
  };
}

/** The case studies in the data's order, each linked to the role (and phase) or named after the project it is about. */
export function caseStudyCards(
  caseStudies: CaseStudy[],
  experiences: Experience[],
  projects: Project[],
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
    subject: subjectOf(caseStudy, experiences, projects),
    skills: caseStudy.skillSlugs.flatMap((slug) => skillNames.get(slug) ?? []),
  }));
}
