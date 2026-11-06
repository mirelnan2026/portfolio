import { z } from "zod";

/**
 * Where a claim about the owner comes from. Only two sources are approved:
 * the CV and the owner's interview brief (see "Content rules" in CLAUDE.md).
 */
export const sourceSchema = z.enum(["cv", "interview-brief"]);

export type Source = z.infer<typeof sourceSchema>;
