import type { Experience, Skill } from "@mirelnan/domain";
import { describe, expect, it } from "vitest";
import { selectedSkill, skillGroups, toggledSkillSearch } from "./skills";

const skill = (slug: string, category: Skill["category"]): Skill => ({
  slug,
  name: slug.toUpperCase(),
  category,
  sourceSlug: "cv",
});

interface Link {
  skillSlug: string;
  phaseSlug?: string;
  contextNote?: string;
}

const role = (slug: string, start: string, end: string, links: Link[]) =>
  ({
    slug,
    company: `${slug} company`,
    period: { start, end },
    phases: [{ slug: "dashboard", title: "Dashboard", period: { start: "2026-01", end } }],
    skills: links.map((link) => ({
      skillSlug: link.skillSlug,
      phaseSlug: link.phaseSlug ?? null,
      contextNote: link.contextNote ?? null,
      sourceSlug: "cv",
    })),
  }) as unknown as Experience;

describe("skillGroups", () => {
  const groups = skillGroups(
    [
      skill("angular", "frontend"),
      skill("claude-code", "ai-assisted-development"),
      skill("typescript", "frontend"),
      skill("unlinked", "cloud"),
    ],
    [
      role("newer", "2025-01", "2026-10", [
        { skillSlug: "angular", contextNote: "Both phases." },
        { skillSlug: "claude-code", phaseSlug: "dashboard" },
        { skillSlug: "typescript" },
      ]),
      role("older", "2020-01", "2020-12", [{ skillSlug: "angular" }]),
    ],
    "2026-11",
  );

  it("orders the groups by their most important skill and keeps the skills' order inside", () => {
    expect(groups.map((group) => [group.name, group.skills.map((item) => item.slug)])).toEqual([
      ["Frontend", ["angular", "typescript"]],
      ["AI-assisted development", ["claude-code"]],
    ]);
  });

  it("gives each skill its months, its roles newest first and the sources' notes", () => {
    expect(groups[0]?.skills[0]).toEqual({
      slug: "angular",
      name: "ANGULAR",
      months: 22 + 12,
      roles: [
        { experienceSlug: "newer", company: "newer company", phase: null, years: "2025–2026" },
        { experienceSlug: "older", company: "older company", phase: null, years: "2020" },
      ],
      notes: ["Both phases."],
    });
  });

  it("names the phase and its years when the skill was used in one phase", () => {
    expect(groups[1]?.skills[0]?.roles).toEqual([
      { experienceSlug: "newer", company: "newer company", phase: "Dashboard", years: "2026" },
    ]);
  });

  it("selects a skill by slug and ignores an unknown one", () => {
    expect(selectedSkill(groups, "typescript")?.name).toBe("TYPESCRIPT");
    expect(selectedSkill(groups, "cobol")).toBeNull();
    expect(selectedSkill(groups, null)).toBeNull();
  });
});

describe("toggledSkillSearch", () => {
  it.each([
    ["", "angular", "?skill=angular"],
    ["?skill=react", "angular", "?skill=angular"],
    ["?skill=angular", "angular", ""],
    ["?utm_source=linkedin", "angular", "?utm_source=linkedin&skill=angular"],
    ["?skill=angular&utm_source=linkedin", "angular", "?utm_source=linkedin"],
  ])("from %j, pressing %s gives %j", (search, slug, expected) => {
    expect(toggledSkillSearch(search, slug)).toBe(expected);
  });
});
