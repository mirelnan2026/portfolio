import type { Industry } from "../entities/industry";

export interface IndustryRepository {
  /** All industries, in display order. */
  list(): Promise<Industry[]>;
}
