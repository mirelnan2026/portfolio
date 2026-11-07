import type { Experience } from "@mirelnan/domain";
import { usedSkills } from "./skill-usages";

export const incorom = {
  slug: "incorom",
  company: "INCOROM",
  role: "Full Stack Developer (PHP, jQuery)",
  employmentType: "full-time",
  workMode: "on-site",
  location: "Ploiesti, Romania",
  period: { start: "2014-05", end: "2015-12" },
  phases: [],
  highlights: [
    {
      body: "Developed web applications with PHP (Laravel), JavaScript and AJAX.",
      ownership: "contributed",
      featured: null,
      phaseSlug: null,
      sourceSlug: "cv",
    },
    {
      body: "Created and maintained MySQL and PostgreSQL databases; integrated JSON/XML web services.",
      ownership: "contributed",
      featured: null,
      phaseSlug: null,
      sourceSlug: "cv",
    },
  ],
  skills: usedSkills("cv", [
    "php",
    "laravel",
    "javascript",
    "jquery",
    "ajax",
    "mysql",
    "postgresql",
    "json",
  ]),
  products: [],
  sourceSlug: "cv",
} satisfies Experience;
