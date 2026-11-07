import type { Experience } from "@mirelnan/domain";
import { usedSkills } from "./skill-usages";

export const cnGroup = {
  slug: "cn-group",
  company: "CN Group CZ s.r.o. (now Ciklum)",
  role: "Full Stack Developer (Node.js, Angular)",
  employmentType: "full-time",
  workMode: "hybrid",
  location: "Bucharest, Romania",
  period: { start: "2017-12", end: "2020-08" },
  phases: [],
  highlights: [
    {
      body: "Built web applications with JavaScript, Node.js (Express.js) and Angular 2+.",
      ownership: "contributed",
      featured: null,
      phaseSlug: null,
      sourceSlug: "cv",
    },
    {
      body:
        "Developed real-time features over Socket.io and WebSockets, designed REST APIs and implemented " +
        "Redis caching.",
      ownership: "contributed",
      featured: null,
      phaseSlug: null,
      sourceSlug: "cv",
    },
  ],
  skills: [
    { skillSlug: "angular", phaseSlug: null, contextNote: "Angular 2+", sourceSlug: "cv" },
    ...usedSkills("cv", [
      "nodejs",
      "expressjs",
      "typescript",
      "socket-io",
      "websockets",
      "redis",
      "bootstrap",
      "javascript",
      "rest-apis",
    ]),
  ],
  products: [],
  sourceSlug: "cv",
} satisfies Experience;
