import type { Project } from "../entities/project";
import type { Slug } from "../values/slug";

/** Reads personal projects as whole aggregates. Only released projects exist in the data. */
export interface ProjectRepository {
  /** All projects, most recent release first. */
  list(): Promise<Project[]>;
  /** The project with this slug, or null when there is none. */
  getBySlug(slug: Slug): Promise<Project | null>;
}
