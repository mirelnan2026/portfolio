import type { Experience as Role, Industry, Product, Skill, YearMonth } from "@mirelnan/domain";
import { yearRange } from "../format";
import { splitByAge } from "../timeline";
import { ExperienceCard } from "./experience-card";
import { SectionHeading } from "./section-heading";

interface Props {
  experiences: Role[];
  products: Product[];
  industries: Industry[];
  skills: Skill[];
  currentMonth: YearMonth;
}

const bySlug = <T extends { slug: string }>(items: T[]) =>
  new Map(items.map((item) => [item.slug, item]));

/** The timeline, newest first; roles that ended more than ten years ago are grouped at the end. */
export function Experience({ experiences, products, industries, skills, currentMonth }: Props) {
  const { recent, earlier } = splitByAge(experiences, currentMonth);
  const lookups = {
    products: bySlug(products),
    industries: bySlug(industries),
    skills: bySlug(skills),
    currentMonth,
  };
  const earliest = earlier.at(-1);
  const latest = earlier.at(0);

  return (
    <section id="experience" aria-labelledby="experience-title" className="pb-24">
      <SectionHeading id="experience-title">Experience</SectionHeading>
      <ol>
        {recent.map((experience) => (
          <li key={experience.slug}>
            <ExperienceCard experience={experience} {...lookups} />
          </li>
        ))}
      </ol>
      {earliest !== undefined && latest !== undefined && (
        <details className="group">
          <summary className="w-fit cursor-pointer text-[0.9375rem] font-medium text-muted-foreground hover:text-foreground">
            Earlier experience ·{" "}
            {yearRange({ start: earliest.period.start, end: latest.period.end })} ·{" "}
            {earlier.map((experience) => experience.company).join(", ")}
          </summary>
          <ol className="pt-8">
            {earlier.map((experience) => (
              <li key={experience.slug}>
                <ExperienceCard experience={experience} {...lookups} />
              </li>
            ))}
          </ol>
        </details>
      )}
    </section>
  );
}
