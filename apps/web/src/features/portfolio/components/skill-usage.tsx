import { tenureLabel } from "../format";
import type { SkillItem } from "../skills";

/** "Where it was used": the selected skill's time, its roles (linked to the timeline) and the sources' notes. */
export function SkillUsage({ skill }: { skill: SkillItem | null }) {
  if (skill === null) {
    return (
      <p className="text-sm text-muted-foreground">
        Select a skill to see where it was used and to highlight those roles in the timeline.
      </p>
    );
  }

  const roles = `${String(skill.roles.length)} ${skill.roles.length === 1 ? "role" : "roles"}`;
  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="font-mono text-xs text-muted-foreground">Where it was used</p>
        <p className="text-xl font-semibold tracking-tight">{skill.name}</p>
        <p className="font-mono text-xs text-muted-foreground">
          {tenureLabel(skill.months).spoken} · {roles}
        </p>
      </div>
      <ul className="flex flex-col gap-1 text-sm">
        {skill.roles.map((role) => (
          <li key={role.experienceSlug}>
            <a
              href={`#experience-${role.experienceSlug}`}
              className="font-medium underline underline-offset-4"
            >
              {role.company}
            </a>
            <span className="text-muted-foreground">
              {role.phase === null ? "" : ` · ${role.phase}`} · {role.years}
            </span>
          </li>
        ))}
      </ul>
      {skill.notes.map((note) => (
        <p key={note} className="text-sm text-muted-foreground">
          {note}
        </p>
      ))}
    </div>
  );
}
