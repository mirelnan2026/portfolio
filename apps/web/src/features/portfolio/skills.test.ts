import type { Experience, Skill } from "@mirelnan/domain";
import { describe, expect, it } from "vitest";
import { skillGroups } from "./skills";

const skill = (slug: string, category: Skill["category"]): Skill => ({
  slug,
  name: slug.toUpperCase(),
  category,
  sourceSlug: "cv",
});

const role = (slug: string, start: string, end: string, skillSlugs: string[]) =>
  ({
    slug,
    period: { start, end },
    phases: [],
    skills: skillSlugs.map((skillSlug) => ({
      skillSlug,
      phaseSlug: null,
      contextNote: null,
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
      role("newer", "2025-01", "2026-10", ["angular", "claude-code", "typescript"]),
      role("older", "2020-01", "2020-12", ["angular"]),
    ],
    "2026-11",
  );

  it("orders the groups by their most important skill and keeps the skills' order inside", () => {
    expect(groups.map((group) => [group.name, group.skills.map((item) => item.slug)])).toEqual([
      ["Frontend", ["angular", "typescript"]],
      ["AI-assisted development", ["claude-code"]],
    ]);
  });

  it("gives each skill the months of the roles that used it", () => {
    expect(groups[0]?.skills[0]).toEqual({ slug: "angular", name: "ANGULAR", months: 22 + 12 });
  });
});
