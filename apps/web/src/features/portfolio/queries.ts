import "server-only";
import { cacheLife } from "next/cache";
import { repositories } from "@/server/container";

// The CV changes only when cv-data is reseeded, which ships with a deploy, and a deploy starts with an
// empty cache. So the reads are cached for as long as Next allows, and the page is prerendered at build.

export async function getProfile() {
  "use cache";
  cacheLife("max");
  return repositories.profile.get();
}
