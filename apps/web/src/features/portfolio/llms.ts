import type {
  CaseStudy,
  Education,
  Experience,
  Language,
  Profile,
  WorkflowStep,
} from "@mirelnan/domain";
import { tenureLabel, yearRange } from "./format";
import type { SkillItem } from "./skills";

export interface LlmsInput {
  profile: Profile;
  experiences: Experience[];
  skills: SkillItem[];
  caseStudies: CaseStudy[];
  workflow: WorkflowStep[];
  education: Education[];
  languages: Language[];
  url: string;
}

/**
 * The site as Markdown for AI search (llmstxt.org): the same records the page shows, as self-contained
 * statements. Owned highlights say so; products are left out, since they are context, not claims.
 */
export function llmsTxt(input: LlmsInput): string {
  const { profile, experiences, skills, caseStudies, workflow, education, languages, url } = input;
  const lines = [`# ${profile.name}`, "", `> ${profile.headline}`, "", profile.summary];

  lines.push("", "## Experience");
  for (const experience of experiences) {
    lines.push(
      "",
      `### ${experience.role}, ${experience.company} (${yearRange(experience.period)})`,
      "",
      ...experience.highlights.map(
        (highlight) => `- ${highlight.body}${highlight.ownership === "owned" ? " (owned)" : ""}`,
      ),
    );
  }

  lines.push(
    "",
    "## Top skills",
    "",
    ...skills.map((skill) => `- ${skill.name}: ${tenureLabel(skill.months).spoken}`),
  );

  lines.push("", "## Case studies");
  for (const caseStudy of caseStudies) {
    lines.push(
      "",
      `### [${caseStudy.title}](${url}/#case-study-${caseStudy.slug})`,
      "",
      `- Context: ${caseStudy.context}`,
      `- Approach: ${caseStudy.approach}`,
      `- Outcome: ${caseStudy.outcome}`,
      `- What it shows: ${caseStudy.whatItShows}`,
    );
  }

  lines.push(
    "",
    "## How I work",
    "",
    ...workflow.map((step) => `- ${step.title}: ${step.body}`),
    "",
    "## Education",
    "",
    ...education.map(
      (entry) =>
        `- ${entry.degree}, ${entry.institution} (${String(entry.startYear)}–${String(entry.endYear)})`,
    ),
    "",
    "## Languages",
    "",
    ...languages.map(
      (language) =>
        `- ${language.name}: ${language.proficiency}${language.cefrLevel === null ? "" : ` (${language.cefrLevel})`}`,
    ),
    "",
    "## Contact",
    "",
    `- Website: ${url}`,
    `- LinkedIn: ${profile.linkedinUrl}`,
    `- Email: ${profile.email}`,
    "",
  );
  return lines.join("\n");
}
