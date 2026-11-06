import type { Skill } from "../entities/skill";

export interface SkillRepository {
  /** All skills, grouped by category in CV order. */
  list(): Promise<Skill[]>;
}
