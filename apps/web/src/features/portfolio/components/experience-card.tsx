import type { Experience, Industry, Product, Skill, YearMonth } from "@mirelnan/domain";
import { durationLabel, employmentLine, yearRange } from "../format";
import { cardSkills } from "../timeline";
import { ProductNote } from "./product-note";

/** How many highlights a role shows before "Show all" (owner decision). */
const visibleHighlights = 5;

const numberWords = ["zero", "one", "two", "three", "four", "five", "six"];

interface Props {
  experience: Experience;
  products: Map<string, Product>;
  industries: Map<string, Industry>;
  skills: Map<string, Skill>;
  currentMonth: YearMonth;
}

/** One role in the timeline: when, what, the phases and products, the achievements and the technologies. */
export function ExperienceCard({ experience, products, industries, skills, currentMonth }: Props) {
  const productOf = (phaseSlug: string | null) =>
    experience.products
      .filter((link) => link.phaseSlug === phaseSlug)
      .flatMap((link) => products.get(link.productSlug) ?? []);
  const [shown, hidden] = [
    experience.highlights.slice(0, visibleHighlights),
    experience.highlights.slice(visibleHighlights),
  ];
  const technologies = cardSkills(experience).flatMap((usage) => skills.get(usage.skillSlug) ?? []);
  // Phases newest first, numbered in the order they happened.
  const phases = experience.phases
    .map((phase, index) => ({ phase, number: index + 1 }))
    .toReversed();

  return (
    <article
      id={`experience-${experience.slug}`}
      className="grid gap-x-8 gap-y-3 pb-12 md:grid-cols-[11rem_minmax(0,1fr)]"
    >
      <p className="flex gap-3 font-mono text-[0.8125rem] text-muted-foreground md:flex-col md:gap-0.5 md:pt-1">
        <span className="text-foreground">{yearRange(experience.period)}</span>
        <span>{durationLabel(experience.period, currentMonth)}</span>
      </p>

      <div className="flex flex-col gap-4 md:border-l md:pl-8">
        <div>
          <h3 className="text-xl font-semibold tracking-tight">{experience.role}</h3>
          <p className="text-[0.9375rem] text-muted-foreground">{employmentLine(experience)}</p>
        </div>

        {phases.length > 0 && (
          <>
            <p className="text-sm font-medium">
              {experience.employmentType === "contract" ? "One contract, " : ""}
              {numberWords[phases.length] ?? phases.length} phases
            </p>
            <ol className="flex flex-col gap-3">
              {phases.map(({ phase, number }) => (
                <li
                  key={phase.slug}
                  className="grid grid-cols-[1.75rem_minmax(0,1fr)] gap-3 rounded-xl bg-muted p-4"
                >
                  <span className="font-mono text-[0.8125rem] font-medium text-brand">
                    {String(number).padStart(2, "0")}
                  </span>
                  <div className="flex flex-col gap-2">
                    <p className="font-medium">
                      {phase.title}{" "}
                      <span className="font-normal text-muted-foreground">
                        · {yearRange(phase.period)} · {industries.get(phase.industrySlug)?.name}
                      </span>
                    </p>
                    <p className="text-sm text-muted-foreground">{phase.summary}</p>
                    {productOf(phase.slug).map((product) => (
                      <div key={product.slug} className="mt-2">
                        <ProductNote product={product} />
                      </div>
                    ))}
                  </div>
                </li>
              ))}
            </ol>
          </>
        )}

        {productOf(null).map((product) => (
          <ProductNote
            key={product.slug}
            product={product}
            industry={industries.get(product.industrySlug)}
          />
        ))}

        <HighlightList items={shown} />
        {hidden.length > 0 && (
          <details className="group">
            <summary className="w-fit cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
              <span className="group-open:hidden">Show all {experience.highlights.length}</span>
              <span className="hidden group-open:inline">Show fewer</span>
            </summary>
            <div className="pt-3">
              <HighlightList items={hidden} />
            </div>
          </details>
        )}

        {technologies.length > 0 && (
          <ul aria-label="Technologies" className="flex flex-wrap gap-1.5">
            {technologies.map((skill) => (
              <li key={skill.slug} className="rounded-md border px-2 py-0.5 font-mono text-xs">
                {skill.name}
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}

function HighlightList({ items }: { items: Experience["highlights"] }) {
  return (
    <ul className="flex list-disc flex-col gap-2 pl-5 text-[0.9375rem] marker:text-muted-foreground">
      {items.map((highlight) => (
        <li key={highlight.body}>
          {highlight.body}
          {highlight.ownership === "owned" && (
            <span className="ml-2 font-mono text-xs font-medium text-brand">Owned</span>
          )}
        </li>
      ))}
    </ul>
  );
}
