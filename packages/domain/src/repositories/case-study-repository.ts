import type { CaseStudy } from "../entities/case-study";
import type { Slug } from "../values/slug";

export interface CaseStudyRepository {
  /** All case studies, in display order. */
  list(): Promise<CaseStudy[]>;
  /** The case study with this slug, or null when there is none. */
  getBySlug(slug: Slug): Promise<CaseStudy | null>;
}
