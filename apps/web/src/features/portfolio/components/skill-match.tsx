"use client";

import { CheckIcon } from "lucide-react";
import { useSearchParams } from "next/navigation";

/** "✓ PHP" under a role's dates, when the skill selected in `?skill=` is one the role used. */
export function SkillMatch({ skills }: { skills: { slug: string; name: string }[] }) {
  const slug = useSearchParams().get("skill");
  const skill = skills.find((candidate) => candidate.slug === slug);
  if (skill === undefined) {
    return null;
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-brand bg-brand-soft px-1.5 py-0.5 font-sans text-xs font-medium text-brand md:mt-1">
      <CheckIcon aria-hidden="true" className="size-3" />
      <span className="sr-only">Uses</span> {skill.name}
    </span>
  );
}
