"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { type SkillGroup, selectedSkill, toggledSkillSearch } from "../skills";
import { SkillList } from "./skill-list";

/**
 * The interactive skill list: `?skill=<slug>` selects a skill, so a selection can be shared as a link.
 * Pressing a skill only replaces the URL (no request: the page is static); each timeline role shows its own
 * "✓ <skill>" label (`SkillMatch`), which reads the same URL.
 */
export function SkillFilter({ groups }: { groups: SkillGroup[] }) {
  const selected = selectedSkill(groups, useSearchParams().get("skill"));
  const firstRender = useRef(true);
  const pressedRef = useRef<HTMLButtonElement>(null);

  // The timeline is static server HTML, outside this component's tree. A matching role inside a closed
  // "Earlier experience" group would hide its "✓ <skill>" label, so the effect opens that group.
  useEffect(() => {
    const matching = new Set(selected?.roles.map((role) => role.experienceSlug));
    const timeline = document.getElementById("experience");
    for (const role of timeline?.querySelectorAll<HTMLElement>("[data-experience]") ?? []) {
      if (matching.has(role.dataset.experience ?? "")) {
        role.closest("details")?.setAttribute("open", "");
      }
    }
  }, [selected]);

  // A shared link opens at the top of the page, so on the first render only it scrolls: to the link's fragment
  // when it has one (`?skill=ngxs#experience-sware`), otherwise to the pressed skill. It runs after the effect
  // above, which may have opened "Earlier experience" and moved everything below it. Later presses never scroll.
  useEffect(() => {
    if (!firstRender.current) return;
    firstRender.current = false;
    if (selected === null) return;
    const fragment = decodeURIComponent(window.location.hash.slice(1));
    if (fragment === "") {
      pressedRef.current?.scrollIntoView({ block: "center" });
    } else {
      document.getElementById(fragment)?.scrollIntoView();
    }
  }, [selected]);

  function toggle(slug: string) {
    const search = toggledSkillSearch(window.location.search, slug);
    window.history.replaceState(null, "", `${window.location.pathname}${search}`);
  }

  return (
    <SkillList groups={groups} selected={selected} onToggle={toggle} pressedRef={pressedRef} />
  );
}
