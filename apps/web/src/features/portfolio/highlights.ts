import type { Experience } from "@mirelnan/domain";
import { yearRange } from "./format";

/** One card in the Highlights section. */
export interface HighlightCard {
  title: string;
  body: string;
  owned: boolean;
  company: string;
  /** "2025–2026", from the phase when the highlight belongs to one, otherwise from the experience. */
  years: string;
  experienceSlug: string;
}

/** The featured highlights, in the order of their rank. */
export function highlightCards(experiences: Experience[]): HighlightCard[] {
  return experiences
    .flatMap((experience) =>
      experience.highlights.flatMap((highlight) => {
        if (highlight.featured === null) {
          return [];
        }
        const phase = experience.phases.find((item) => item.slug === highlight.phaseSlug);
        return [
          {
            rank: highlight.featured.rank,
            card: {
              title: highlight.featured.title,
              body: highlight.body,
              owned: highlight.ownership === "owned",
              company: experience.company,
              years: yearRange((phase ?? experience).period),
              experienceSlug: experience.slug,
            },
          },
        ];
      }),
    )
    .toSorted((a, b) => a.rank - b.rank)
    .map(({ card }) => card);
}
