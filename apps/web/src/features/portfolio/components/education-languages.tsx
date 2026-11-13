import type { Education, Language } from "@mirelnan/domain";
import { SectionHeading } from "./section-heading";

/** Education and spoken languages, side by side on wide screens: two short sections, as in the CV. */
export function EducationAndLanguages({
  education,
  languages,
}: {
  education: Education[];
  languages: Language[];
}) {
  return (
    <div className="grid gap-x-10 gap-y-16 pb-24 md:grid-cols-2">
      {education.length > 0 && (
        <section id="education" aria-labelledby="education-title">
          <SectionHeading id="education-title">Education</SectionHeading>
          <ul className="flex flex-col gap-4">
            {education.map((entry) => (
              <li key={entry.slug}>
                <p className="font-medium">{entry.degree}</p>
                <p className="text-muted-foreground">
                  {entry.institution} ·{" "}
                  <span className="font-mono text-xs whitespace-nowrap">
                    {entry.startYear}–{entry.endYear}
                  </span>
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}
      {languages.length > 0 && (
        <section id="languages" aria-labelledby="languages-title">
          <SectionHeading id="languages-title">Languages</SectionHeading>
          <ul className="flex flex-col gap-2">
            {languages.map((language) => (
              <li key={language.code}>
                <span className="font-medium">{language.name}</span>{" "}
                <span className="text-muted-foreground">
                  · {language.proficiency}
                  {language.cefrLevel === null ? "" : ` (${language.cefrLevel})`}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
