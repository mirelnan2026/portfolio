import type { Experience } from "../entities/experience";
import type { Slug } from "../values/slug";

/** Reads experiences as whole aggregates, with their phases, highlights, skills and products. */
export interface ExperienceRepository {
  /** All experiences, most recent first (CV order). */
  list(): Promise<Experience[]>;
  /** The experience with this slug, or null when there is none. */
  getBySlug(slug: Slug): Promise<Experience | null>;
}
