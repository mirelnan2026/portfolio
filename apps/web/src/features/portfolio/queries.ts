import "server-only";
import { cacheLife } from "next/cache";
import { repositories } from "@/server/container";
import { toYearMonth } from "@mirelnan/domain";

// The CV changes only when cv-data is reseeded, which ships with a deploy, and a deploy starts with an
// empty cache. So the reads are cached for as long as Next allows, and the page is prerendered at build.

export async function getProfile() {
  "use cache";
  cacheLife("max");
  return repositories.profile.get();
}

export async function getExperiences() {
  "use cache";
  cacheLife("max");
  return repositories.experiences.list();
}

export async function getProducts() {
  "use cache";
  cacheLife("max");
  return repositories.products.list();
}

export async function getIndustries() {
  "use cache";
  cacheLife("max");
  return repositories.industries.list();
}

export async function getSkills() {
  "use cache";
  cacheLife("max");
  return repositories.skills.list();
}

export async function getCaseStudies() {
  "use cache";
  cacheLife("max");
  return repositories.caseStudies.list();
}

export async function getWorkflow() {
  "use cache";
  cacheLife("max");
  return repositories.workflow.list();
}

/** The month the page was built in: durations of ongoing roles and the "earlier" cut-off count up to it. */
// eslint-disable-next-line @typescript-eslint/require-await -- a "use cache" function has to be async
export async function getCurrentMonth() {
  "use cache";
  cacheLife("max");
  return toYearMonth(new Date());
}
