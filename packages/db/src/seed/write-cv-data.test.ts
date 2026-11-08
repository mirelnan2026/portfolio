import { cvData } from "@mirelnan/cv-data";
import { count } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";
import type { Database } from "../database";
import * as tables from "../schema";
import { createTestDatabase } from "../test-database";
import { writeCvData } from "./write-cv-data";

let db: Database;

beforeAll(async () => {
  db = await createTestDatabase();
});

/** The number of rows in every table, keyed by table name. */
async function rowCounts() {
  const entries = await Promise.all(
    Object.entries({
      sources: tables.sources,
      industries: tables.industries,
      skills: tables.skills,
      products: tables.products,
      profiles: tables.profiles,
      education: tables.education,
      languages: tables.languages,
      experiences: tables.experiences,
      experiencePhases: tables.experiencePhases,
      experienceHighlights: tables.experienceHighlights,
      experienceSkills: tables.experienceSkills,
      experienceProducts: tables.experienceProducts,
      projects: tables.projects,
      caseStudies: tables.caseStudies,
      caseStudySkills: tables.caseStudySkills,
    }).map(async ([name, table]) => {
      const [row] = await db.select({ value: count() }).from(table);
      return [name, row?.value] as const;
    }),
  );
  return Object.fromEntries(entries);
}

describe("writeCvData", () => {
  it("writes every record of the CV, and the constraints accept it", async () => {
    await writeCvData(db, cvData);

    const counts = await rowCounts();
    expect(counts).toMatchObject({
      sources: cvData.sources.length,
      skills: cvData.skills.length,
      products: cvData.products.length,
      profiles: 1,
      experiences: cvData.experiences.length,
      experienceHighlights: cvData.experiences.flatMap((item) => item.highlights).length,
      caseStudies: cvData.caseStudies.length,
      caseStudySkills: cvData.caseStudies.flatMap((item) => item.skillSlugs).length,
    });
  });

  it("gives the same rows, with the same ids, when it runs again", async () => {
    await writeCvData(db, cvData);
    const first = await db.select().from(tables.experienceHighlights);

    await writeCvData(db, cvData);
    const second = await db.select().from(tables.experienceHighlights);

    expect(second).toEqual(first);
    expect(await rowCounts()).toMatchObject({ profiles: 1 });
  });

  it("rejects invalid data before touching the database", async () => {
    const before = await rowCounts();
    const invalid = { ...cvData, profile: { ...cvData.profile, email: "not-an-email" } };

    await expect(writeCvData(db, invalid)).rejects.toThrow();
    expect(await rowCounts()).toEqual(before);
  });

  it("rolls back everything when a write fails halfway", async () => {
    const before = await rowCounts();
    // Valid for zod (a well-formed slug), but no such skill exists: the seed fails on the last record.
    const [first, ...rest] = cvData.caseStudies;
    if (first === undefined) {
      throw new Error("The CV has no case study to break");
    }
    const broken = { ...cvData, caseStudies: [...rest, { ...first, skillSlugs: ["not-a-skill"] }] };

    await expect(writeCvData(db, broken)).rejects.toThrow(/Unknown skill "not-a-skill"/);
    expect(await rowCounts()).toEqual(before);
  });
});
