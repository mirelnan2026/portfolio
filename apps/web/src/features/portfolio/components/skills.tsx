import { Suspense } from "react";
import type { SkillGroup } from "../skills";
import { SectionHeading } from "./section-heading";
import { SkillFilter } from "./skill-filter";
import { SkillList } from "./skill-list";

/**
 * Every skill by category, each with the time it was used. The filter reads the URL, which a static page only
 * knows in the browser, so it sits in a Suspense boundary: the prerendered HTML holds the same list with nothing
 * selected, and the browser swaps in the filter.
 */
export function Skills({ groups }: { groups: SkillGroup[] }) {
  if (groups.length === 0) {
    return null;
  }

  return (
    <section id="skills" aria-labelledby="skills-title" className="pb-24">
      <SectionHeading id="skills-title">Skills</SectionHeading>
      <Suspense fallback={<SkillList groups={groups} selected={null} />}>
        <SkillFilter groups={groups} />
      </Suspense>
    </section>
  );
}
