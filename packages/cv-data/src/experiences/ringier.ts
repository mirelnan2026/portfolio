import type { Experience } from "@mirelnan/domain";
import { usedSkills } from "./skill-usages";

export const ringier = {
  slug: "ringier",
  company: "Ringier AG",
  role: "Full Stack Developer (Node.js, React)",
  employmentType: "full-time",
  workMode: "on-site",
  location: "Bucharest, Romania",
  period: { start: "2016-01", end: "2016-07" },
  phases: [],
  highlights: [
    {
      body:
        "Developed web applications with Node.js (Express.js, Socket.io), React (Flux, Redux) and PHP " +
        "(Laravel).",
      ownership: "contributed",
      featured: null,
      phaseSlug: null,
      sourceSlug: "cv",
    },
    {
      body:
        "Built real-time applications over WebSockets, used Redis as a data-structure server and " +
        "integrated REST/JSON services.",
      ownership: "contributed",
      featured: null,
      phaseSlug: null,
      sourceSlug: "cv",
    },
  ],
  skills: usedSkills("cv", [
    "nodejs",
    "expressjs",
    "socket-io",
    "react",
    "flux",
    "redux",
    "php",
    "laravel",
    "redis",
    "mysql",
    "websockets",
    "rest-apis",
    "json",
  ]),
  products: [],
  sourceSlug: "cv",
} satisfies Experience;
