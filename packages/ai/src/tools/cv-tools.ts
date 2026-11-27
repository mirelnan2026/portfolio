import {
  skillTenure,
  slugSchema,
  type Experience,
  type Repositories,
  type YearMonth,
} from "@mirelnan/domain";
import { z } from "zod";

/** The ports the chat tools may read. `products` is absent on purpose: product text is site context only. */
export type CvRepositories = Pick<
  Repositories,
  "profile" | "experiences" | "projects" | "skills" | "caseStudies" | "workflow"
>;

export type ToolResult =
  | { ok: true; data: unknown }
  | { ok: false; error: "unknown_tool" | "invalid_input" | "not_found" };

interface Context {
  repos: CvRepositories;
  now: YearMonth;
}

const maxSearchResults = 10;

/** Validates the raw input first, then runs the handler. A handler that returns `null` means "not found". */
function tool<S extends z.ZodType>(
  schema: S,
  handler: (input: z.output<S>, context: Context) => Promise<unknown>,
): (raw: unknown, context: Context) => Promise<ToolResult> {
  return async (raw, context) => {
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      return { ok: false, error: "invalid_input" };
    }
    const data = await handler(parsed.data, context);
    return data === null ? { ok: false, error: "not_found" } : { ok: true, data };
  };
}

const noInput = z.strictObject({});
const slugInput = z.strictObject({ slug: slugSchema });
const searchInput = z.strictObject({ query: z.string().trim().min(1).max(200) });

/** A search result. Every hit names the source of its claim, so an answer can cite it. */
type SearchHit =
  | {
      kind: "highlight";
      experienceSlug: string;
      ownership: "owned" | "contributed";
      text: string;
      sourceSlug: string;
    }
  | {
      kind: "highlight";
      projectSlug: string;
      // A personal project is the owner's alone, so each of its highlights is owned.
      ownership: "owned";
      text: string;
      sourceSlug: string;
    }
  | { kind: "skill"; experienceSlug: string; skill: string; category: string; sourceSlug: string }
  | { kind: "skill"; projectSlug: string; skill: string; category: string; sourceSlug: string };

/** Lower case, with hyphens and runs of spaces read as one space: "Spec-Driven" and "spec  driven" are alike. */
const normalized = (text: string) =>
  text
    .toLowerCase()
    .replace(/[-\s]+/g, " ")
    .trim();

/**
 * Words a visitor adds around the term they mean ("AI tools", "experience with Claude"). They say nothing about which
 * part of the CV is meant, and a text rarely repeats them, so they are dropped from a query; a query made only of
 * them is searched as it is.
 */
const genericWords = new Set(
  (
    "a an the and or of in on for to with at by his your you my mirel " +
    "experience tool tools skill skills technology technologies stack"
  ).split(" "),
);

/**
 * Scores a text against a query, word by word. Each word matches at the start of a word, so "ai" finds "AI" and
 * "AI-driven" but not "campaign", and "transform" still finds "transformation". Words are escaped: they are searched
 * as text, never run as patterns; a word that starts with a symbol (".NET") is matched anywhere. A text must contain
 * every word of a short query; from three words on, one may be missing, because a visitor often adds a word the CV
 * does not use ("spec driven development"). Generic words are dropped first. Returns how many words matched, or null
 * when the text does not match.
 */
function queryScorer(query: string): (text: string) => number | null {
  const words = normalized(query).split(" ");
  const specific = words.filter((word) => !genericWords.has(word));
  const patterns = (specific.length > 0 ? specific : words).map((word) => {
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(/^\w/.test(word) ? `\\b${escaped}` : escaped);
  });
  const required = patterns.length >= 3 ? patterns.length - 1 : patterns.length;
  return (text) => {
    const haystack = normalized(text);
    const score = patterns.filter((pattern) => pattern.test(haystack)).length;
    return score >= required ? score : null;
  };
}

/** "ended" when the period has an end month, "ongoing" otherwise: the model cannot tell from dates alone. */
const statusOf = (experience: Experience) =>
  experience.period.end === null ? ("ongoing" as const) : ("ended" as const);

const summaryOf = (experience: Experience) => ({
  slug: experience.slug,
  company: experience.company,
  role: experience.role,
  period: experience.period,
  status: statusOf(experience),
});

/**
 * A skill's time in use, worded so it never overstates it: whole years are stated as they are, anything over
 * is "more than", and under a year is said as such. The model repeats it, so it never has a number to round up.
 */
function tenurePhrase(months: number): string {
  const years = Math.floor(months / 12);
  if (years === 0) {
    return "less than a year";
  }
  const counted = `${String(years)} ${years === 1 ? "year" : "years"}`;
  return months % 12 === 0 ? counted : `more than ${counted}`;
}

const tools = {
  get_profile: tool(noInput, async (_input, { repos }) => {
    // Competencies are kept for search engines only (CLAUDE.md): they are never shown or quoted.
    const { competencies: _competencies, ...profile } = await repos.profile.get();
    return profile;
  }),

  list_experiences: tool(noInput, async (_input, { repos }) =>
    (await repos.experiences.list()).map(summaryOf),
  ),

  get_experience: tool(slugInput, async ({ slug }, { repos }) => {
    const experience = await repos.experiences.getBySlug(slug);
    if (experience === null) {
      return null;
    }
    // Products never reach the model: they are site context only.
    const { products: _products, ...withoutProducts } = experience;
    return { ...withoutProducts, status: statusOf(experience) };
  }),

  search_cv: tool(searchInput, async ({ query }, { repos }) => {
    const scoreOf = queryScorer(query);
    const [experiences, projects, skills] = await Promise.all([
      repos.experiences.list(),
      repos.projects.list(),
      repos.skills.list(),
    ]);
    const skillsBySlug = new Map(skills.map((skill) => [skill.slug, skill] as const));

    /** A skill matches by its name and its category, read with spaces ("testing and tooling"). */
    const matchingSkill = (skillSlug: string) => {
      const skill = skillsBySlug.get(skillSlug);
      if (skill === undefined) return null;
      const category = normalized(skill.category);
      const score = scoreOf(`${skill.name} ${category}`);
      return score === null ? null : { score, skill: skill.name, category };
    };

    const found: { hit: SearchHit; score: number }[] = [];
    for (const experience of experiences) {
      for (const highlight of experience.highlights) {
        const score = scoreOf(highlight.body);
        if (score !== null) {
          found.push({
            score,
            hit: {
              kind: "highlight",
              experienceSlug: experience.slug,
              ownership: highlight.ownership,
              text: highlight.body,
              sourceSlug: highlight.sourceSlug,
            },
          });
        }
      }
      for (const link of experience.skills) {
        const match = matchingSkill(link.skillSlug);
        if (match) {
          const { score, ...skill } = match;
          found.push({
            score,
            hit: {
              kind: "skill",
              experienceSlug: experience.slug,
              ...skill,
              sourceSlug: link.sourceSlug,
            },
          });
        }
      }
    }
    // Personal projects come after the roles: among hits that match equally well, client work is shown first.
    for (const project of projects) {
      for (const highlight of project.highlights) {
        const score = scoreOf(highlight.body);
        if (score !== null) {
          found.push({
            score,
            hit: {
              kind: "highlight",
              projectSlug: project.slug,
              ownership: "owned",
              text: highlight.body,
              sourceSlug: highlight.sourceSlug,
            },
          });
        }
      }
      for (const link of project.skills) {
        const match = matchingSkill(link.skillSlug);
        if (match) {
          const { score, ...skill } = match;
          found.push({
            score,
            hit: {
              kind: "skill",
              projectSlug: project.slug,
              ...skill,
              sourceSlug: link.sourceSlug,
            },
          });
        }
      }
    }
    // The best matches first; the sort is stable, so equal scores keep the order above.
    return found
      .sort((a, b) => b.score - a.score)
      .slice(0, maxSearchResults)
      .map(({ hit }) => hit);
  }),

  list_skills: tool(noInput, async (_input, { repos, now }) => {
    const [experiences, projects, skills] = await Promise.all([
      repos.experiences.list(),
      repos.projects.list(),
      repos.skills.list(),
    ]);
    const tenure = skillTenure(experiences, projects, now);
    return skills.flatMap((skill) => {
      const used = tenure.get(skill.slug);
      return used === undefined
        ? []
        : [
            {
              slug: skill.slug,
              name: skill.name,
              category: skill.category,
              tenure: tenurePhrase(used.months),
            },
          ];
    });
  }),

  list_case_studies: tool(noInput, async (_input, { repos }) =>
    (await repos.caseStudies.list()).map(({ slug, title, context }) => ({ slug, title, context })),
  ),

  get_case_study: tool(slugInput, async ({ slug }, { repos }) => repos.caseStudies.getBySlug(slug)),

  get_workflow: tool(noInput, async (_input, { repos }) => repos.workflow.list()),
};

export const cvToolNames = Object.keys(tools) as (keyof typeof tools)[];

/** The input schema of each tool: the same objects that validate the input, reused to describe the tool to the model. */
export const cvToolInputSchemas = {
  get_profile: noInput,
  list_experiences: noInput,
  get_experience: slugInput,
  search_cv: searchInput,
  list_skills: noInput,
  list_case_studies: noInput,
  get_case_study: slugInput,
  get_workflow: noInput,
} as const;

export async function runCvTool(
  name: string,
  rawInput: unknown,
  repos: CvRepositories,
  now: YearMonth,
): Promise<ToolResult> {
  if (!Object.hasOwn(tools, name)) {
    return { ok: false, error: "unknown_tool" };
  }
  return tools[name as keyof typeof tools](rawInput, { repos, now });
}
