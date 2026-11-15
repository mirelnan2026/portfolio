# 0009. Personal projects count in a skill's years and evidence

- Status: Accepted
- Date: 2026-11-15
- Extends: [0006](0006-content-sources-and-projects.md), [0008](0008-skills-matrix-source.md)

## Context

The site itself is now a personal project in the data (`portfolio`, from the project brief). Its stack brings skills
that no professional role used: Next.js, Tailwind CSS, WCAG, Turborepo, Playwright and Vercel. They are in the CV's
"Technical skills", so they belong in the skill list.

Until now a skill's years and its "Where it was used" panel came only from the roles' skill links, and a content test
required every skill to be linked to an experience. A skill used only in a project would fail the test and, on the
page, have no years and be left out.

## Decision

- **A project's skill links are evidence, like a role's.** Every skill must be linked to at least one experience or
  project (the `cv-data` content test).
- **A project's period counts in the years.** `skillTenure` takes the experiences and the projects, and computes the
  union of the periods: a role's or phase's period for a role link, the project's period for a project link. Months
  are counted once, so a project during a role adds nothing, and the years still round down.
- **Projects are listed apart from roles.** `SkillTenure` has `projectSlugs` next to `experienceSlugs`; the panel
  shows a project as text ("mirelnan.dev · personal project · 2026–present"), and a case study about a project names
  it the same way, because the page has no projects section to link to.

## Consequences

- (+) Every skill in the CV has evidence on the site, and its years come from the data.
- (+) Overlaps count once, so a skill used both at work and in a project is never overstated.
- (−) Years from personal projects sit next to years from paid work in one number; the panel says which is which.
- (−) A project with a long `period` and little real use would inflate the years; `period` must stay the time the
  owner actually worked on it.

## Alternatives considered

- **Only roles give years; project skills show "used in <project>" without years:** stricter about professional
  experience, but the six skills would be the only ones without a duration, and the CV lists them as skills.
- **Link the project's skills to a role instead:** shorter, but false: no role used them.
- **Keep the project out of the data until a projects section exists:** the CV would list skills the site cannot
  back.
