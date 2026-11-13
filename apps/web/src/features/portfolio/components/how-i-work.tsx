import type { WorkflowStep } from "@mirelnan/domain";
import { SectionHeading } from "./section-heading";

/** How the owner works with AI agents: the CV's sentence about it, then the steps, in order. */
export function HowIWork({ intro, steps }: { intro: string | null; steps: WorkflowStep[] }) {
  if (steps.length === 0) {
    return null;
  }

  return (
    <section id="how-i-work" aria-labelledby="how-i-work-title" className="@container pb-24">
      <SectionHeading id="how-i-work-title">How I work</SectionHeading>
      {intro !== null && <p className="mb-6 text-pretty">{intro}</p>}
      <ol className="grid gap-4 @2xl:grid-cols-3">
        {steps.map((step, index) => (
          <li key={step.slug} className="flex flex-col gap-1.5 rounded-xl bg-muted p-5">
            <h3 className="font-mono text-xs font-medium text-brand">
              <span aria-hidden="true">{index + 1} · </span>
              {step.title}
            </h3>
            <p>{step.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
