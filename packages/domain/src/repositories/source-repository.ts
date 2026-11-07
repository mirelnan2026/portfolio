import type { Source } from "../entities/source";

export interface SourceRepository {
  /** All registered sources: the only documents that claims about the owner may come from. */
  list(): Promise<Source[]>;
}
