import { describe, expect, it } from "vitest";
import type { Experience } from "../entities/experience";
import type { Period } from "../values/period";
import { monthsCovered, skillTenure } from "./skill-tenure";

const period = (start: string, end: string | null): Period => ({ start, end });

describe("monthsCovered", () => {
  it.each([
    ["no periods", [], 0],
    ["one period, both months included", [period("2023-03", "2026-10")], 44],
    ["separate periods add up", [period("2020-01", "2020-12"), period("2022-01", "2022-06")], 18],
    [
      "overlapping periods count once",
      [period("2020-01", "2020-12"), period("2020-07", "2021-06")],
      18,
    ],
    ["adjacent periods merge", [period("2020-01", "2020-06"), period("2020-07", "2020-12")], 12],
    [
      "a period inside another adds nothing",
      [period("2020-01", "2020-12"), period("2020-03", "2020-04")],
      12,
    ],
    ["the order does not matter", [period("2022-01", "2022-06"), period("2020-01", "2020-12")], 18],
  ])("%s", (_name, periods, expected) => {
    expect(monthsCovered(periods, "2026-11")).toBe(expected);
  });

  it("runs an ongoing period to the current month", () => {
    expect(monthsCovered([period("2026-01", null)], "2026-11")).toBe(11);
  });
});

function experience(
  slug: string,
  experiencePeriod: Period,
  skills: { skillSlug: string; phaseSlug?: string }[],
  phases: { slug: string; period: Period }[] = [],
): Experience {
  return {
    slug,
    company: slug,
    role: "Engineer",
    employmentType: "contract",
    workMode: "remote",
    location: "Bucharest, Romania",
    period: experiencePeriod,
    phases: phases.map((phase) => ({
      ...phase,
      title: phase.slug,
      summary: "Summary.",
      industrySlug: "video-tech",
      sourceSlug: "cv",
    })),
    highlights: [],
    skills: skills.map((link) => ({
      skillSlug: link.skillSlug,
      phaseSlug: link.phaseSlug ?? null,
      contextNote: null,
      sourceSlug: "cv",
    })),
    products: [],
    sourceSlug: "cv",
  };
}

describe("skillTenure", () => {
  const experiences = [
    experience(
      "newer",
      period("2023-03", "2026-10"),
      [{ skillSlug: "angular" }, { skillSlug: "react", phaseSlug: "dashboard" }],
      [
        { slug: "suite", period: period("2023-03", "2024-12") },
        { slug: "dashboard", period: period("2025-01", "2026-10") },
      ],
    ),
    experience("older", period("2020-01", "2022-12"), [{ skillSlug: "angular" }]),
  ];
  const tenure = skillTenure(experiences, "2026-11");

  it("adds up the roles that used a skill, in the order given", () => {
    expect(tenure.get("angular")).toEqual({ months: 44 + 36, experienceSlugs: ["newer", "older"] });
  });

  it("counts only the phase when the link has one", () => {
    expect(tenure.get("react")).toEqual({ months: 22, experienceSlugs: ["newer"] });
  });

  it("leaves out skills no experience uses", () => {
    expect(tenure.has("vue")).toBe(false);
  });
});
