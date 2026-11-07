import type { Experience } from "@mirelnan/domain";
import { usedSkills } from "./skill-usages";

export const freelance = {
  slug: "freelance",
  company: "Freelance",
  role: "Web Designer",
  employmentType: "freelance",
  workMode: null,
  location: "Romania",
  period: { start: "2009-10", end: "2011-02" },
  phases: [],
  highlights: [
    {
      body: "Designed and developed websites using HTML4, XHTML and CSS2.",
      ownership: "contributed",
      featured: null,
      phaseSlug: null,
      sourceSlug: "cv",
    },
  ],
  skills: usedSkills("cv", ["html4", "xhtml", "css2"]),
  products: [],
  sourceSlug: "cv",
} satisfies Experience;
