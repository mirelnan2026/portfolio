import type { CvData } from "@mirelnan/domain";
import { education } from "./education";
import { industries } from "./industries";
import { languages } from "./languages";
import { products } from "./products";
import { profile } from "./profile";
import { skills } from "./skills";
import { sources } from "./sources";

/**
 * The whole CV, in display order. The seed validates it with `cvDataSchema` and loads it.
 * Annotated rather than `satisfies`, so an empty list is still typed as a list of records.
 */
export const cvData: CvData = {
  sources,
  profile,
  experiences: [],
  projects: [],
  skills,
  caseStudies: [],
  industries,
  products,
  education,
  languages,
};
