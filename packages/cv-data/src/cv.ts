import type { CvData } from "@mirelnan/domain";
import { billingCorrectness } from "./case-studies/billing-correctness";
import { darkLaunchBehindFlag } from "./case-studies/dark-launch-behind-flag";
import { sharedLibraryExtraction } from "./case-studies/shared-library-extraction";
import { upgradeSequencing } from "./case-studies/upgrade-sequencing";
import { thisPortfolio } from "./case-studies/this-portfolio";
import { education } from "./education";
import { cnGroup } from "./experiences/cn-group";
import { freelance } from "./experiences/freelance";
import { geoBlueLabel } from "./experiences/geo-blue-label";
import { incorom } from "./experiences/incorom";
import { jwpConnatix } from "./experiences/jwp-connatix";
import { ringier } from "./experiences/ringier";
import { softelligence } from "./experiences/softelligence";
import { sware } from "./experiences/sware";
import { industries } from "./industries";
import { languages } from "./languages";
import { products } from "./products";
import { profile } from "./profile";
import { portfolio } from "./projects/portfolio";
import { skills } from "./skills";
import { sources } from "./sources";
import { workflow } from "./workflow";

/**
 * The whole CV, in display order. The seed validates it with `cvDataSchema` and loads it.
 * Annotated rather than `satisfies`, so an empty list is still typed as a list of records.
 */
export const cvData: CvData = {
  sources,
  profile,
  experiences: [
    jwpConnatix,
    sware,
    cnGroup,
    softelligence,
    ringier,
    incorom,
    geoBlueLabel,
    freelance,
  ],
  projects: [portfolio],
  skills,
  caseStudies: [
    sharedLibraryExtraction,
    upgradeSequencing,
    darkLaunchBehindFlag,
    billingCorrectness,
    thisPortfolio,
  ],
  industries,
  products,
  education,
  languages,
  workflow,
};
