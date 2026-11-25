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
  | { kind: "skill"; experienceSlug: string; skill: string; sourceSlug: string };

const summaryOf = (experience: Experience) => ({
  slug: experience.slug,
  company: experience.company,
  role: experience.role,
  period: experience.period,
});

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
    return withoutProducts;
  }),

  search_cv: tool(searchInput, async ({ query }, { repos }) => {
    const needle = query.toLowerCase();
    const [experiences, skills] = await Promise.all([
      repos.experiences.list(),
      repos.skills.list(),
    ]);
    const skillNames = new Map(skills.map((skill) => [skill.slug, skill.name] as const));
    const hits: SearchHit[] = [];
    for (const experience of experiences) {
      for (const highlight of experience.highlights) {
        if (highlight.body.toLowerCase().includes(needle)) {
          hits.push({
            kind: "highlight",
            experienceSlug: experience.slug,
            ownership: highlight.ownership,
            text: highlight.body,
            sourceSlug: highlight.sourceSlug,
          });
        }
      }
      for (const link of experience.skills) {
        const name = skillNames.get(link.skillSlug);
        if (name?.toLowerCase().includes(needle)) {
          hits.push({
            kind: "skill",
            experienceSlug: experience.slug,
            skill: name,
            sourceSlug: link.sourceSlug,
          });
        }
      }
    }
    return hits.slice(0, maxSearchResults);
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
              years: Math.floor(used.months / 12),
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
