import type { Experience } from "@mirelnan/domain";
import { usedSkills } from "./skill-usages";

export const geoBlueLabel = {
  slug: "geo-blue-label",
  company: "Geo Blue Label",
  role: "Frontend Developer (jQuery)",
  employmentType: "full-time",
  workMode: "on-site",
  location: "Ploiesti, Romania",
  period: { start: "2011-03", end: "2014-05" },
  phases: [],
  highlights: [
    {
      body:
        "Developed and designed websites using HTML, CSS and JavaScript (jQuery), including PSD-to-HTML " +
        "conversion.",
      ownership: "contributed",
      featured: null,
      phaseSlug: null,
      sourceSlug: "cv",
    },
  ],
  skills: [...usedSkills("cv", ["javascript", "css", "jquery", "ajax", "html"])],
  products: [],
  sourceSlug: "cv",
} satisfies Experience;
