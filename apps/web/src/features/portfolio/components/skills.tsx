import { tenureLabel } from "../format";
import type { SkillGroup } from "../skills";
import { SectionHeading } from "./section-heading";

/** Every skill by category, each with the time it was used, from the roles that list it. */
export function Skills({ groups }: { groups: SkillGroup[] }) {
  if (groups.length === 0) {
    return null;
  }

  return (
    <section id="skills" aria-labelledby="skills-title" className="pb-24">
      <SectionHeading id="skills-title">Skills</SectionHeading>
      <div className="flex flex-col gap-6">
        {groups.map((group) => (
          <div
            key={group.category}
            className="grid gap-x-8 gap-y-2 md:grid-cols-[11rem_minmax(0,1fr)]"
          >
            <h3 className="text-sm font-medium text-muted-foreground md:pt-1">{group.name}</h3>
            <ul className="flex flex-wrap gap-1.5">
              {group.skills.map((skill) => {
                const tenure = tenureLabel(skill.months);
                return (
                  <li key={skill.slug} className="rounded-md border px-2.5 py-1 text-sm">
                    {skill.name}
                    <span
                      aria-hidden="true"
                      className="ml-2 font-mono text-xs text-muted-foreground"
                    >
                      {tenure.text}
                    </span>
                    <span className="sr-only">, {tenure.spoken}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
