import { cvData } from "@mirelnan/cv-data";
import { beforeAll, describe, expect, it } from "vitest";
import type { Database } from "../database";
import { writeCvData } from "../seed/write-cv-data";
import { createTestDatabase } from "../test-database";
import { createDrizzleEducationRepository } from "./drizzle-education-repository";
import { createDrizzleIndustryRepository } from "./drizzle-industry-repository";
import { createDrizzleLanguageRepository } from "./drizzle-language-repository";
import { createDrizzleProductRepository } from "./drizzle-product-repository";
import { createDrizzleProfileRepository } from "./drizzle-profile-repository";
import { createDrizzleSkillRepository } from "./drizzle-skill-repository";
import { createDrizzleSourceRepository } from "./drizzle-source-repository";

let db: Database;

beforeAll(async () => {
  db = await createTestDatabase();
  await writeCvData(db, cvData);
});

// Round trip: what the seed writes, the repositories read back as the same domain objects.
describe("Drizzle repositories, after the seed", () => {
  it("read the sources", async () => {
    expect(await createDrizzleSourceRepository(db).list()).toStrictEqual(cvData.sources);
  });

  it("read the profile", async () => {
    expect(await createDrizzleProfileRepository(db).get()).toStrictEqual(cvData.profile);
  });

  it("read the skills", async () => {
    expect(await createDrizzleSkillRepository(db).list()).toStrictEqual(cvData.skills);
  });

  it("read the industries", async () => {
    expect(await createDrizzleIndustryRepository(db).list()).toStrictEqual(cvData.industries);
  });

  it("read the products", async () => {
    expect(await createDrizzleProductRepository(db).list()).toStrictEqual(cvData.products);
  });

  it("read the education", async () => {
    expect(await createDrizzleEducationRepository(db).list()).toStrictEqual(cvData.education);
  });

  it("read the languages", async () => {
    expect(await createDrizzleLanguageRepository(db).list()).toStrictEqual(cvData.languages);
  });
});

describe("Drizzle profile repository, before the seed", () => {
  it("fails with a clear message when there is no profile", async () => {
    const empty = await createTestDatabase();
    await expect(createDrizzleProfileRepository(empty).get()).rejects.toThrow(
      "No profile in the database: run the seed first",
    );
  });
});
