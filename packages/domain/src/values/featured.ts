import { z } from "zod";
import { textSchema } from "./text";

/**
 * A highlight shown as a card in the Highlights section: its card title, and its place in the section
 * (1 = first). The order is decided in the data, not in the component.
 */
export const featuredSchema = z.strictObject({
  title: textSchema,
  rank: z.int().min(1),
});

export type Featured = z.infer<typeof featuredSchema>;
