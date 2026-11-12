# @mirelnan/cv-data

The CV as typed data: the single source of truth for everything the site and the AI tools say about the
owner. The seed validates it against the `domain` schemas and loads it into Postgres; the app never reads
this package directly.

Every record points to a registered source (`sourceSlug`): the CV, an employment brief, a project brief or
the skills matrix ([ADR 0006](../../docs/adr/0006-content-sources-and-projects.md),
[ADR 0008](../../docs/adr/0008-skills-matrix-source.md)).

```
src/
├─ cv.ts               assembles everything, in display order
├─ profile.ts          name, headline, intro, summary, competencies (SEO only), contact
├─ experiences/        one file per role: phases, highlights, products, skills (generated)
├─ skills.ts           generated: every skill, most important first
├─ products.ts         public products, site context only
├─ industries.ts, case-studies/, education.ts, languages.ts, sources.ts
└─ cv.test.ts          content tests
scripts/               generators and their runbook (scripts/README.md)
```

## How new content gets in

Every change takes the same path:

```
CV / skills matrix / public page  →  cv-data  →  tests  →  db:seed  →  next build  →  site
```

No migration is needed for new content; only a change to the shape of the data (a new column) needs one.

### A new skill

1. Add it to the CV's "Technical skills", in the right group, and to a role's "Technologies" line if it is
   among the most relevant ones there. Export the CV again without the phone number.
2. Add one row per role where it was used to the skills matrix; at a role with phases, set `phaseSlug` when
   it was used in only one phase.
3. Add its name to `ranking` in `scripts/skills-config.ts`, where it belongs by importance, plus an alias if
   another spelling of it is used elsewhere.
4. Run the generator: `pnpm --filter @mirelnan/cv-data generate:skills` (see [scripts/README.md](scripts/README.md)).
   It stops, before writing anything, if one of the steps above is missing.

### A new experience

1. Add the role to the CV: title, company, type, period, bullets and a "Technologies" line. Export the CV again.
2. Create `src/experiences/<slug>.ts` by hand, following an existing role:
   - `slug`, `company`, `role`, `employmentType`, `workMode`, `location`, `period`;
   - `highlights`: the CV's bullets word for word, each with `ownership` (`owned` only when the source says
     so) and its `sourceSlug`;
   - `phases: []` and `products: []` when there are none;
   - `skills: []`: left empty for the generator, but the block must exist.
3. Import it in `src/cv.ts` and place it in `experiences`, newest first (a test checks the order, and the
   generator matches the CV's "Technologies" lines to the roles in that order).
4. Add the role's rows to the skills matrix, with its slug as `experienceSlug`, and run the generator.
5. Exactly four highlights are `featured` (one card each in Highlights), with ranks 1 to 4 that set the cards'
   order: to feature a new one, unfeature another and keep the ranks 1 to 4.

### A new product

1. Find a public page that describes the product. Without one there is no source. Use descriptive facts
   only: no vendor figures, no logos, no internal names.
2. Add it to `src/products.ts`: `slug`, `name` (as the public page names it), `url`, `description`,
   `industrySlug`, `sourceUrl` and `retrievedOn` (the day the page was read). A new industry goes in
   `src/industries.ts`.
3. Link it from the experience: `products: [{ productSlug: "<slug>", phaseSlug: null }]`, or with the phase.

Products are shown on the site only; the AI tools never receive them.

### Then, for every change

```bash
git diff packages/cv-data/src                 # every changed line is a claim on the site
pnpm --filter @mirelnan/cv-data test          # references, phases, order, unlinked skills, phone numbers
pnpm --filter @mirelnan/db db:seed            # db:migrate first only if the schema changed
pnpm --filter @mirelnan/web build             # the page is prerendered from the database
```

- Commit `src/` (and `scripts/skills-config.ts` when it changed), never the generator inputs in
  `scripts/input/` (git-ignored).
- When the CV changed, replace `apps/web/public/mirel-nan-cv.pdf` with the new export without the phone
  number, and check it for phone traces (text, links, metadata) before committing it.

## What catches mistakes

| Where            | What it rejects                                                                                                 |
| ---------------- | --------------------------------------------------------------------------------------------------------------- |
| The generator    | an unknown skill, a "Technologies" line without matrix rows, two phases for one skill                           |
| `domain` schemas | unknown keys (e.g. a phone field), invalid periods, phases outside their experience                             |
| `cv.test.ts`     | unknown references, roles out of order, skills without a role, competencies that are skills, phone-like numbers |
| The seed         | invalid data, before it touches the database                                                                    |
| Pre-commit hooks | secrets (gitleaks) and the owner's private list of excluded topics                                              |
