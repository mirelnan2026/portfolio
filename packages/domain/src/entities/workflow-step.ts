import { z } from "zod";
import { slugSchema } from "../values/slug";
import { textSchema } from "../values/text";

/**
 * One step of how the owner works with AI agents ("Specify", "Implement", "Own the result"), in order.
 * The site's "How I work" section shows them, and the chat answers "How do you work with AI tools?" from them.
 */
export const workflowStepSchema = z.strictObject({
  slug: slugSchema,
  title: textSchema,
  body: textSchema,
  sourceSlug: slugSchema,
});

export type WorkflowStep = z.infer<typeof workflowStepSchema>;
