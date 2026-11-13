"use client";

import { MenuIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

interface Section {
  id: string;
  label: string;
}

/**
 * The links to the page's sections: inline from `md`, in a sheet below it. The current section is marked with
 * `aria-current="location"`, a teal underline and the text colour, so it is not shown by colour alone.
 * Links point at "/#id", so they also work from another page (the 404).
 */
export function SectionNav({ sections }: { sections: readonly Section[] }) {
  const [active, setActive] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  // A pressed link wins until the reader scrolls on their own: the last sections are too short to reach the
  // top, so the position alone would mark the one below the link that was pressed.
  const pressed = useRef<string | null>(null);

  // The sections are server HTML outside this tree, so they are found by id once; an IntersectionObserver then
  // reports which of them cross a band just under the sticky header, with no layout reads while scrolling.
  useEffect(() => {
    const root = getComputedStyle(document.documentElement);
    const header = parseFloat(root.getPropertyValue("--header-height")) * parseFloat(root.fontSize);
    const visible = new Set<string>();
    let atEnd = false;
    const update = () => {
      const current = atEnd ? sections.at(-1) : sections.find(({ id }) => visible.has(id));
      setActive(pressed.current ?? current?.id ?? null);
    };

    // The band runs from the bottom of the header to 45% down the screen; the first section in it is current.
    const band = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id);
          else visible.delete(entry.target.id);
        }
        update();
      },
      { rootMargin: `-${String(header)}px 0px -55% 0px` },
    );
    // A short last section never reaches the band: once half of the footer is in view, it is the current one.
    const end = new IntersectionObserver(
      ([entry]) => {
        atEnd = (entry?.intersectionRatio ?? 0) >= 0.5;
        update();
      },
      { threshold: [0, 0.5, 1] },
    );
    for (const { id } of sections) {
      const section = document.getElementById(id);
      if (section !== null) band.observe(section);
    }
    const footer = document.getElementById("contact");
    if (footer !== null) end.observe(footer);

    const release = () => {
      pressed.current = null;
    };
    for (const type of ["wheel", "touchmove", "keydown"] as const) {
      window.addEventListener(type, release, { passive: true });
    }
    return () => {
      band.disconnect();
      end.disconnect();
      for (const type of ["wheel", "touchmove", "keydown"] as const) {
        window.removeEventListener(type, release);
      }
    };
  }, [sections]);

  const links = (onNavigate?: () => void) =>
    sections.map(({ id, label }) => (
      <li key={id}>
        <a
          href={`/#${id}`}
          aria-current={active === id ? "location" : undefined}
          onClick={() => {
            pressed.current = id;
            setActive(id);
            onNavigate?.();
          }}
          className={cn(
            "rounded-sm text-muted-foreground underline decoration-transparent decoration-2 underline-offset-8 transition-[color,text-decoration-color] duration-300 ease-out hover:text-foreground motion-reduce:transition-none pointer-coarse:inline-flex pointer-coarse:min-h-11 pointer-coarse:items-center",
            "aria-[current]:text-foreground aria-[current]:decoration-brand",
          )}
        >
          {label}
        </a>
      </li>
    ));

  return (
    <>
      <nav aria-label="Sections" className="hidden md:block">
        <ul className="flex items-center gap-5 text-sm">{links()}</ul>
      </nav>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          render={<Button variant="ghost" size="icon" aria-label="Menu" className="md:hidden" />}
        >
          <MenuIcon aria-hidden />
        </SheetTrigger>
        <SheetContent side="right" className="p-6">
          <SheetTitle>Sections</SheetTitle>
          <nav aria-label="Sections">
            <ul className="flex flex-col gap-4 text-base">
              {links(() => {
                setOpen(false);
              })}
            </ul>
          </nav>
        </SheetContent>
      </Sheet>
    </>
  );
}
