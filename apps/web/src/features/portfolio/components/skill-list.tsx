"use client";

import { CheckIcon } from "lucide-react";
import type { Ref } from "react";
import { cn } from "cn";
import { tenureLabel } from "../format";
import type { SkillGroup, SkillItem } from "../skills";
import { SkillUsage } from "./skill-usage";

interface Props {
  groups: SkillGroup[];
  selected: SkillItem | null;
  /** Absent in the prerendered HTML, which the browser replaces once the filter has read the URL. */
  onToggle?: (slug: string) => void;
  /** Attached to the pressed button, so the filter can bring it into view. */
  pressedRef?: Ref<HTMLButtonElement>;
}

/**
 * The skills as toggle buttons, by group, with the "Where it was used" panel: beside the groups on large
 * screens, under the selected skill's group on small ones, so it appears where the tap happened.
 */
export function SkillList({ groups, selected, onToggle, pressedRef }: Props) {
  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start lg:gap-10">
      <div className="flex flex-col gap-6">
        {groups.map((group) => (
          <div
            key={group.category}
            className="grid gap-x-8 gap-y-2 md:grid-cols-[11rem_minmax(0,1fr)]"
          >
            <h3 className="text-sm font-medium text-muted-foreground md:pt-1.5">{group.name}</h3>
            <ul className="flex flex-wrap gap-1.5">
              {group.skills.map((skill) => {
                const pressed = skill.slug === selected?.slug;
                const tenure = tenureLabel(skill.months);
                return (
                  <li key={skill.slug}>
                    <button
                      ref={pressed ? pressedRef : undefined}
                      type="button"
                      aria-pressed={pressed}
                      onClick={() => onToggle?.(skill.slug)}
                      className={cn(
                        "cursor-pointer rounded-md border px-2.5 py-1 text-left text-sm pointer-coarse:min-h-11",
                        pressed
                          ? "border-brand bg-brand-soft font-medium text-brand"
                          : "hover:bg-muted",
                      )}
                    >
                      {pressed && <CheckIcon aria-hidden="true" className="mr-1 inline size-3.5" />}
                      {skill.name}
                      <span
                        aria-hidden="true"
                        className={cn(
                          "ml-2 font-mono text-xs",
                          pressed ? "text-brand" : "text-muted-foreground",
                        )}
                      >
                        {tenure.text}
                      </span>
                      <span className="sr-only">, {tenure.spoken}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
            {group.skills.some((skill) => skill.slug === selected?.slug) && (
              <div className="rounded-xl border bg-card p-4 md:col-start-2 lg:hidden">
                <SkillUsage skill={selected} />
              </div>
            )}
          </div>
        ))}
      </div>
      <aside
        aria-label="Where the selected skill was used"
        aria-live="polite"
        className="hidden rounded-xl border bg-card p-5 lg:sticky lg:top-[calc(var(--header-height)+1.5rem)] lg:block"
      >
        <SkillUsage skill={selected} />
      </aside>
    </div>
  );
}
