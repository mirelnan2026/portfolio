import type { Education } from "../entities/education";

export interface EducationRepository {
  /** All education entries, most recent first. */
  list(): Promise<Education[]>;
}
