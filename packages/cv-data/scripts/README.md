# cv-data generators

## `generate-skills.ts`

Regenerates the skill data from two private documents, so the skills and their links to the roles never
drift from the CV:

- `src/skills.ts`: every skill in the CV's "Technical skills", with the CV's names and groups, in the order of
  `ranking` in `skills-config.ts`;
- the `skills` block of each `src/experiences/<slug>.ts`: the role's "Technologies" line first (source `cv`),
  then the rest of the role's rows in the skills matrix (source `skills-matrix`). A link the employment brief
  already states keeps its source and its context note.

Nothing else in the data is touched. Why the matrix is a source: [ADR 0008](../../../docs/adr/0008-skills-matrix-source.md).

### Inputs

Both go in `scripts/input/`, which is git-ignored, so they cannot be committed by mistake:

| File                | What                                                                                |
| ------------------- | ----------------------------------------------------------------------------------- |
| `cv.pdf`            | the CV, **the export without the phone number**                                     |
| `skills-matrix.csv` | one row per role and skill: `experienceSlug,phaseSlug,experience,skill` (see below) |

```csv
experienceSlug,phaseSlug,experience,skill
example-corp,,"Frontend Engineer at Example Corp",Angular
example-corp,first-phase,"Frontend Engineer at Example Corp",React.js
```

- `experienceSlug`: the slug of an experience in `src/experiences/`.
- `phaseSlug`: empty for the whole experience, or one of the experience's phases when the skill was used only
  there.
- `experience`: a label for the person editing the file; the generator ignores it.
- `skill`: the CV's name, or a spelling listed in `aliases`. Broad terms (`broadTerms`) are skipped.

Requires `pdftotext` (Debian/Ubuntu: `sudo apt install poppler-utils`).

### Run

```bash
pnpm --filter @mirelnan/cv-data generate:skills
# other locations: … generate:skills --cv <file.pdf> --matrix <file.csv>
```

The generator stops with a message, before writing anything, when:

- a skill is not in `ranking` and has no alias;
- a skill in the ranking is missing from the CV's "Technical skills";
- the CV's role count differs from the experiences in `src/`;
- a role's "Technologies" line names a skill that the matrix does not have for that role;
- the same skill has two different phases in one role.

### After a run

1. Review `git diff packages/cv-data/src`: every changed line is a claim on the site.
2. `pnpm --filter @mirelnan/cv-data test` (the content tests check references, phases and that every skill is
   linked to a role).
3. Deploy order: `db:migrate` → `db:seed` → `next build` (the page is prerendered from the database).
4. Commit `src/` only. Delete the inputs when you no longer need them.

### A new skill

Add its name to `ranking` (where it belongs by importance), and to the CV's "Technical skills". When its slug
should differ from the kebab-case name, add it to `slugOverrides`. Slugs stay stable once the site is live.
