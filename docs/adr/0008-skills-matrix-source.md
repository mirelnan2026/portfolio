# 0008. A skills matrix as a source for the roles' skills

- Status: Accepted
- Date: 2026-11-11
- Extends: [0006](0006-content-sources-and-projects.md)

## Context

The site shows, for every skill, the roles where it was used and the years of use, and job match
compares requirements such as "5+ years with React" against the same links. Both need the full
list of technologies per role.

The CV cannot carry that list: a role's "Technologies" line would run to four printed lines, so the
CV keeps only the most relevant technologies there, while its "Technical skills" section lists all
of them. The full list per role exists only in the owner's own notes.

## Decision

- **New source kind `skills-matrix`** (in the `domain` enum and the `source_kind` Postgres enum):
  the owner's list of the technologies used in each role, one row per role and skill, with the
  phase for a JWX skill used in only one phase. It is a private document, transcribed into
  `cv-data` like the others; its location is not stored.
- **Each link keeps the most direct source:** `cv` when the role's "Technologies" line names the
  skill, the employment brief when the brief states it (with its context note), otherwise
  `skills-matrix`.
- **The CV's "Technical skills" is the union of the links**, with the CV's names and groups, in the
  owner's ranking. A content test checks that every skill is linked to at least one experience.
- **Broad terms are not skills.** The CV's "Core competencies" ("Web Development", …) become
  `profile.competencies`, used only in structured data for search engines.

## Consequences

- Years per skill can be computed from the data alone, as the union of the linked periods.
- The site can show more technologies for a role than the CV does; every one still has a source.
- A wrong row in the matrix becomes a wrong claim on the site and in the AI answers, so the
  matrix is reviewed against the CV before each transcription.

## Alternatives considered

- **Complete "Technologies" lines in the CV:** one source, but a CV that is harder to read.
- **Only the CV's lines:** shorter, but the years and the job-match evidence would be incomplete.
- **Skills linked by hand in the code, without a source:** breaks the rule that every claim points
  to an approved document.
