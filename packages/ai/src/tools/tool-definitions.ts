import { z } from "zod";
import { cvToolInputSchemas, cvToolNames } from "./cv-tools";

/** A tool as the Claude API expects it: a name, a description the model reads, and a JSON Schema for its input. */
export interface ToolDefinition {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
}

/** What each tool is for, in the words the model uses to choose it. */
const descriptions: Record<(typeof cvToolNames)[number], string> = {
  get_profile:
    "Returns Mirel's public profile: name, headline, summary, location and availability.",
  list_experiences:
    "Lists the roles Mirel has held, most recent first, with company, role and period. Use it to find a role's slug.",
  get_experience:
    "Returns one role with its phases and highlights. Each highlight carries its ownership (owned or contributed) and its sourceSlug.",
  search_cv:
    'Searches the highlights of the roles, and the skills of the roles and personal projects by name or category (for example "cloud"), ignoring case. It does not search case studies or the workflow. Returns at most 10 hits, each with its ownership or skill and category, and its sourceSlug.',
  list_skills:
    'Lists the skills Mirel has used, each with its tenure as a phrase that never overstates it (for example "more than 5 years").',
  list_case_studies:
    "Lists the case studies by slug, title and context. Use get_case_study for the details of one.",
  get_case_study:
    "Returns one case study with its context, approach, outcome and what it shows about Mirel.",
  get_workflow:
    "Returns the steps of how Mirel works with AI agents. Use it for questions about his working method. It names no tools: for the tools and skills he used, use search_cv.",
};

/** Converts a zod input schema to JSON Schema, without the `$schema` marker the API does not need. */
function toInputSchema(schema: z.ZodType): Record<string, unknown> {
  const { $schema: _schema, ...jsonSchema } = z.toJSONSchema(schema) as Record<string, unknown>;
  return jsonSchema;
}

/** The read-only CV tools, described for the Claude API. The same schemas validate the input in `runCvTool`. */
export const cvToolDefinitions: ToolDefinition[] = cvToolNames.map((name) => ({
  name,
  description: descriptions[name],
  input_schema: toInputSchema(cvToolInputSchemas[name]),
}));
