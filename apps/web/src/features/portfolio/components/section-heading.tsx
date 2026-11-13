import type { ReactNode } from "react";

/** A section's title: uppercase and monospaced, at the card titles' size, so it stands out while scrolling. */
export function SectionHeading({ id, children }: { id: string; children: ReactNode }) {
  return (
    <h2
      id={id}
      className="mb-6 font-mono text-xl font-semibold tracking-[0.06em] text-foreground uppercase"
    >
      {children}
    </h2>
  );
}
