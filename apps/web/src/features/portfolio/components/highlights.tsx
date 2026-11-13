import type { HighlightCard } from "../highlights";
import { SectionHeading } from "./section-heading";

/** The four featured achievements, in the order their rank sets in the data. */
export function Highlights({ cards }: { cards: HighlightCard[] }) {
  if (cards.length === 0) {
    return null;
  }

  return (
    <section id="highlights" aria-labelledby="highlights-title" className="@container pb-24">
      <SectionHeading id="highlights-title">Highlights</SectionHeading>
      <ul className="grid gap-4 @2xl:grid-cols-2">
        {cards.map((card) => (
          <li key={card.title}>
            <article className="flex h-full flex-col gap-2.5 rounded-xl border bg-card p-6 text-card-foreground">
              <h3 className="text-xl font-semibold tracking-tight">{card.title}</h3>
              <p className="text-muted-foreground">{card.body}</p>
              <p className="mt-auto flex flex-wrap items-center gap-x-2.5 pt-1.5 font-mono text-xs text-muted-foreground">
                {card.owned && (
                  <>
                    <span className="font-medium text-brand">Owned</span>
                    <span aria-hidden="true">·</span>
                  </>
                )}
                <a
                  href={`#experience-${card.experienceSlug}`}
                  className="underline-offset-4 hover:underline"
                >
                  {card.company}, {card.years}
                </a>
              </p>
            </article>
          </li>
        ))}
      </ul>
    </section>
  );
}
