import type { Experience } from "@mirelnan/domain";
import { usedSkills } from "./skill-usages";

export const softelligence = {
  slug: "softelligence",
  company: "Softelligence Romania",
  role: "Full Stack Developer (Node.js, React, Angular)",
  employmentType: "full-time",
  workMode: "hybrid",
  location: "Bucharest, Romania",
  period: { start: "2016-07", end: "2017-12" },
  phases: [],
  highlights: [
    {
      body: "Built applications with JavaScript, Node.js (Express.js, Kraken.js) and React with Redux.",
      ownership: "contributed",
      featured: null,
      phaseSlug: null,
      sourceSlug: "cv",
    },
    {
      body: "Integrated payments with Stripe.js and wrote end-to-end test suites with Nightwatch.js and Selenium.",
      ownership: "contributed",
      featured: null,
      phaseSlug: null,
      sourceSlug: "cv",
    },
  ],
  skills: usedSkills("cv", [
    "react",
    "redux",
    "jsx",
    "nodejs",
    "expressjs",
    "kraken-js",
    "stripe-js",
    "nightwatch-js",
    "selenium",
    "javascript",
  ]),
  products: [{ productSlug: "hpi-check", phaseSlug: null }],
  sourceSlug: "cv",
} satisfies Experience;
