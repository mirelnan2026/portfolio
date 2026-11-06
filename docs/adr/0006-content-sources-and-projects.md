# 0006. Content sources as data, and personal projects

- Status: Accepted
- Date: 2026-11-06

## Context

Every claim about the owner must be traceable to an approved document, and the AI tools (chat,
job match, MCP server) answer only from approved content. Until now there were two sources, the CV
and one interview brief about the JWX contract, encoded as `source: "cv" | "interview-brief"`.

The owner will build personal projects that they fully own. Each project has its own brief,
written with Claude while the project is in progress. A project is listed only once it is released,
it may later go offline, and its links (website, repository, app stores) are all optional, because
some projects stay private. Once finished, a project also gets a short line in the CV.

A fixed enum of documents does not scale: every new project would change the domain types, the
database enum and require a migration. The documents also follow different rules: an employment
brief falls under the client's confidentiality rules, while a project brief does not.

## Decision

- **Sources are data.** `cv-data` holds a list of sources `{ slug, kind, title }`. Every record
  that makes a claim points to one with `sourceSlug`. Adding a document means adding a source,
  and that change goes through review like any other commit.
- **`kind` is fixed in the domain:** `cv`, `employment-brief`, `project-brief`. The kind decides
  which rules apply (confidentiality for employment briefs).
- **The AI answers only from registered sources**, through the data, never from the documents
  themselves. Briefs are material the owner transcribes into `cv-data`; their location (a PDF, a
  private Claude artifact) is not stored in the data.
- **`Project` is a separate aggregate**, next to `Experience`: `period` (how long the owner worked
  on it), `releasedOn` (required, so only released projects exist in the data), `offlineSince`
  (null while online), public-only optional links, an optional mobile app with at least one store,
  highlights and skills. It has no `ownership` field, because a personal project is fully owned.
- **Links are shown only while a project is online** (`visibleLinks`). Once it is offline, the
  website and store links are hidden: an expired domain can be bought by someone else.
- **Case studies are optional** (zero or more per experience or project) and say what they are
  about with a discriminated union: `{ kind: "experience", experienceSlug, phaseSlug }` or
  `{ kind: "project", projectSlug }`.

## Alternatives considered

- **One enum value per document** (`"jwx-brief"`, `"portfolio-brief"`, …): type-checked at compile
  time, but every project changes the domain and the database, and the rules per document can
  only be guessed from its name.
- **A single "personal-project" source:** simple, but it says what kind of document a claim comes
  from, not which document.
- **`period` plus a stored `status`:** the two can contradict each other (an "in progress" project
  with an end date). The state is derived from `releasedOn` and `offlineSince` instead.
- **Unreleased projects in the data, filtered out by consumers:** every page, tool and the MCP
  server would need the filter, and forgetting it once would leak unreleased plans.
- **`projectSlug` next to `experienceSlug` on case studies:** both could be set at once. The
  discriminated union makes that impossible to write.

## Consequences

- (+) A new project or brief is a data change: no domain change, no migration.
- (+) Provenance names the exact document, and the kind carries the rules.
- (+) Unreleased projects cannot leak, because they cannot be written into the data.
- (−) A misspelled `sourceSlug` is no longer a compile-time error; the `cv-data` tests check that
  every `sourceSlug` points to a registered source.
- (−) Renaming `source` to `sourceSlug` touched every schema in `domain` (done before any data,
  database or AI code existed, when it was cheapest).
