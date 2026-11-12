import type { ReactNode } from "react";

/** A section's title: small, uppercase, monospaced and muted, as in the mockup. The id labels the section. */
export function SectionHeading({ id, children }: { id: string; children: ReactNode }) {
  return (
    <h2
      id={id}
      className="mb-6 font-mono text-[0.8125rem] font-medium tracking-[0.08em] text-muted-foreground uppercase"
    >
      {children}
    </h2>
  );
}
