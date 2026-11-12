import { cvDataSchema, toYearMonth } from "@mirelnan/domain";
import { describe, expect, it } from "vitest";
import { cvData } from "./cv";

/** Every value stored under `key`, at any depth: `valuesOf(cvData, "skillSlug")`. */
function valuesOf(value: unknown, key: string): unknown[] {
  if (Array.isArray(value)) {
    return value.flatMap((item) => valuesOf(item, key));
  }
  if (value !== null && typeof value === "object") {
    return Object.entries(value as Record<string, unknown>).flatMap(([name, child]) =>
      name === key ? [child] : valuesOf(child, key),
    );
  }
  return [];
}

/** Every text in the data, at any depth, for the content rules. */
function textsOf(value: unknown): string[] {
  if (typeof value === "string") {
    return [value];
  }
  if (value !== null && typeof value === "object") {
    return Object.values(value as Record<string, unknown>).flatMap(textsOf);
  }
  return [];
}

function duplicates(values: string[]) {
  return values.filter((value, index) => values.indexOf(value) !== index);
}

const slugs = (list: { slug: string }[]) => list.map((item) => item.slug);

describe("cvData", () => {
  it("matches the domain schemas", () => {
    const result = cvDataSchema.safeParse(cvData);
    expect(result.error?.issues ?? []).toEqual([]);
  });

  it.each([
    ["sources", slugs(cvData.sources)],
    ["experiences", slugs(cvData.experiences)],
    ["skills", slugs(cvData.skills)],
    ["industries", slugs(cvData.industries)],
    ["products", slugs(cvData.products)],
    ["case studies", slugs(cvData.caseStudies)],
    ["education", slugs(cvData.education)],
    ["languages", cvData.languages.map((language) => language.code)],
  ])("has unique %s", (_name, values) => {
    expect(duplicates(values)).toEqual([]);
  });

  it("lists each skill of an experience once per phase", () => {
    const repeated = cvData.experiences.flatMap((experience) =>
      duplicates(
        experience.skills.map(
          (usage) => `${experience.slug}/${usage.phaseSlug ?? "-"}/${usage.skillSlug}`,
        ),
      ),
    );
    expect(repeated).toEqual([]);
  });

  it("links every skill to at least one experience", () => {
    // The CV's "Technical skills" are the union of the roles' skills, so each has years and roles to show.
    const used = new Set(
      cvData.experiences.flatMap((experience) => experience.skills.map((usage) => usage.skillSlug)),
    );
    expect(slugs(cvData.skills).filter((slug) => !used.has(slug))).toEqual([]);
  });

  it("keeps competencies apart from skills", () => {
    // A broad term that is also a skill would be counted twice: once for search, once with years.
    const names = new Set(cvData.skills.map((skill) => skill.name.toLowerCase()));
    expect(cvData.profile.competencies.filter((term) => names.has(term.toLowerCase()))).toEqual([]);
  });

  it("lists experiences newest first", () => {
    const starts = cvData.experiences.map((experience) => experience.period.start);
    expect(starts).toEqual(starts.toSorted().reverse());
  });

  it("features four highlights, ranked 1 to 4: one card each in the Highlights grid", () => {
    const ranks = [...cvData.experiences, ...cvData.projects]
      .flatMap((record) => record.highlights)
      .flatMap((highlight) => (highlight.featured === null ? [] : [highlight.featured.rank]));
    expect(ranks.toSorted((a, b) => a - b)).toEqual([1, 2, 3, 4]);
  });
});

describe("references", () => {
  it.each([
    ["sourceSlug", slugs(cvData.sources)],
    ["skillSlug", slugs(cvData.skills)],
    ["skillSlugs", slugs(cvData.skills)],
    ["industrySlug", slugs(cvData.industries)],
    ["productSlug", slugs(cvData.products)],
  ])("every %s points to a registered record", (key, known) => {
    // `.flat()` opens the lists, e.g. a case study's `skillSlugs`.
    const unknown = valuesOf(cvData, key)
      .flat()
      .filter((value) => !known.includes(String(value)));
    expect(unknown).toEqual([]);
  });

  it("every case study is about a registered experience, phase or project", () => {
    const unknown = cvData.caseStudies.filter(({ about }) => {
      if (about.kind === "project") {
        return !cvData.projects.some((project) => project.slug === about.projectSlug);
      }
      const experience = cvData.experiences.find((item) => item.slug === about.experienceSlug);
      return (
        experience === undefined ||
        (about.phaseSlug !== null &&
          !experience.phases.some((phase) => phase.slug === about.phaseSlug))
      );
    });
    expect(unknown.map((caseStudy) => caseStudy.slug)).toEqual([]);
  });
});

describe("content rules", () => {
  const texts = textsOf(cvData);

  it("contains no phone number", () => {
    // A run of digits and separators with 9 or more digits; dates like 2026-11-03 have only 8.
    const phoneLike = texts.flatMap((text) => text.match(/\+?\d[\d\s().-]{7,}\d/g) ?? []);
    expect(phoneLike.filter((match) => match.replace(/\D/g, "").length >= 9)).toEqual([]);
  });

  it("contains no change counts", () => {
    expect(texts.filter((text) => /\b\d+\s+changes\b/i.test(text))).toEqual([]);
  });

  // The other excluded topics are checked by the `private terms` pre-commit job: their patterns would reveal
  // what they exclude, so they stay out of the repository.

  it("lists only projects released by the current month", () => {
    // Months compare as strings because they are all YYYY-MM.
    const currentMonth = toYearMonth(new Date());
    const future = cvData.projects.filter(
      (project) =>
        project.releasedOn > currentMonth ||
        (project.offlineSince !== null && project.offlineSince > currentMonth),
    );
    expect(future).toEqual([]);
  });
});
