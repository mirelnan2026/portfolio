import { z } from "zod";

/**
 * A stable, URL-safe identifier, e.g. "jwp-connatix" or "angular".
 * Lowercase words joined by single hyphens; it never changes once published.
 */
export const slugSchema = z
  .string()
  .max(64)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Expected a kebab-case slug");

export type Slug = z.infer<typeof slugSchema>;
