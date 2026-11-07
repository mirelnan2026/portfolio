import type { Experience } from "@mirelnan/domain";
import { usedSkills } from "./skill-usages";

export const sware = {
  slug: "sware",
  company: "Sware",
  role: "Frontend Engineer (Angular)",
  employmentType: "contract",
  workMode: "remote",
  location: null,
  period: { start: "2020-09", end: "2023-02" },
  phases: [],
  highlights: [
    {
      body: "Built web applications in Angular 12+ with Material UI and Syncfusion UI component libraries.",
      ownership: "contributed",
      featured: null,
      phaseSlug: null,
      sourceSlug: "cv",
    },
    {
      body:
        "Implemented reactive state management with NgRx and NGXS, reusable component libraries and " +
        "responsive layouts.",
      ownership: "contributed",
      featured: null,
      phaseSlug: null,
      sourceSlug: "cv",
    },
  ],
  skills: [
    { skillSlug: "angular", phaseSlug: null, contextNote: "Angular 12+", sourceSlug: "cv" },
    ...usedSkills("cv", [
      "typescript",
      "rxjs",
      "ngrx",
      "ngxs",
      "angular-material",
      "syncfusion-ui",
      "sass",
      "nestjs",
      "responsive-web-design",
    ]),
  ],
  products: [{ productSlug: "res-q", phaseSlug: null }],
  sourceSlug: "cv",
} satisfies Experience;
