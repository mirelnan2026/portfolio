import type { Language } from "../entities/language";

export interface LanguageRepository {
  /** All languages, in CV order. */
  list(): Promise<Language[]>;
}
