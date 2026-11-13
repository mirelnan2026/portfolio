import type { CaseStudyCard } from "../case-studies";
import { SectionHeading } from "./section-heading";

/**
 * The stories behind the highlights: each card shows its context, and the approach, the outcome and what it
 * shows open in a native disclosure, so the page stays static and every word is in the HTML.
 */
export function CaseStudies({ cards }: { cards: CaseStudyCard[] }) {
  if (cards.length === 0) {
    return null;
  }

  return (
    <section id="case-studies" aria-labelledby="case-studies-title" className="@container pb-24">
      <SectionHeading id="case-studies-title">Case studies</SectionHeading>
      <ul className="grid items-start gap-x-8 gap-y-10 @2xl:grid-cols-2">
        {cards.map((card) => (
          <li key={card.slug}>
            <article
              id={`case-study-${card.slug}`}
              className="flex flex-col gap-2.5 border-t-2 border-foreground pt-4"
            >
              {card.subject !== null && (
                <p className="font-mono text-xs text-muted-foreground">
                  <a href={card.subject.href} className="underline-offset-4 hover:underline">
                    {card.subject.label}
                  </a>{" "}
                  · <span className="whitespace-nowrap">{card.subject.period}</span>
                </p>
              )}
              <h3 className="text-xl font-semibold tracking-tight">{card.title}</h3>
              <p className="text-muted-foreground">{card.context}</p>
              <details className="group">
                <summary className="w-fit cursor-pointer py-0.5 text-sm font-medium pointer-coarse:py-3">
                  <span className="group-open:hidden">Read the case study</span>
                  <span className="hidden group-open:inline">Show less</span>
                </summary>
                <dl className="flex flex-col gap-3 pt-3">
                  {(
                    [
                      ["Approach", card.approach],
                      ["Outcome", card.outcome],
                      ["What it shows", card.whatItShows],
                    ] as const
                  ).map(([term, text]) => (
                    <div key={term}>
                      <dt className="font-mono text-xs text-muted-foreground">{term}</dt>
                      <dd>{text}</dd>
                    </div>
                  ))}
                </dl>
              </details>
              {card.skills.length > 0 && (
                <ul aria-label="Technologies" className="flex flex-wrap gap-1.5 pt-1">
                  {card.skills.map((skill) => (
                    <li key={skill} className="rounded-md border px-2 py-0.5 font-mono text-xs">
                      {skill}
                    </li>
                  ))}
                </ul>
              )}
            </article>
          </li>
        ))}
      </ul>
    </section>
  );
}
