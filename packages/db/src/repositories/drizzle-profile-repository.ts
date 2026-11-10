import type { ProfileRepository } from "@mirelnan/domain";
import { eq } from "drizzle-orm";
import type { Database } from "../database";
import { profiles, sources } from "../schema";

export function createDrizzleProfileRepository(db: Database): ProfileRepository {
  return {
    async get() {
      const [profile] = await db
        .select({
          name: profiles.name,
          headline: profiles.headline,
          intro: profiles.intro,
          summary: profiles.summary,
          location: profiles.location,
          availability: profiles.availability,
          email: profiles.email,
          linkedinUrl: profiles.linkedinUrl,
          interests: profiles.interests,
          sourceSlug: sources.slug,
        })
        .from(profiles)
        .innerJoin(sources, eq(profiles.sourceId, sources.id))
        .limit(1);
      // The port promises exactly one profile, so an empty table means the seed has not run.
      if (profile === undefined) {
        throw new Error("No profile in the database: run the seed first");
      }
      return profile;
    },
  };
}
