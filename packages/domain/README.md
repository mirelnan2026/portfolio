# @mirelnan/domain

The model of the portfolio and the ports to its data: zod schemas (and the types inferred from them),
repository interfaces and pure rules. It is the innermost layer, so it has no I/O, no framework and no
Node.js built-ins (enforced by the `library` ESLint preset); every other package depends on it, and it
depends only on zod.

```
src/
├─ values/        small value objects: slug, text, https URL, YearMonth, Period { start, end }
├─ entities/      one schema per entity or aggregate: profile, experience (phases, highlights, skill and
│                 product links), project, case study, skill, product, industry, education, language,
│                 source, and cv-data (the whole snapshot the seed loads)
├─ repositories/  the ports: one read-only interface per aggregate root, bundled in `Repositories`
├─ rules/         pure functions: durations ("3 years 8 months"), the links a project shows
└─ testing/       an in-memory implementation of the ports, for tests
```

## Public API

| Entry point                | What                                                                              |
| -------------------------- | --------------------------------------------------------------------------------- |
| `@mirelnan/domain`         | schemas, types, repository interfaces and rules, listed by name in `src/index.ts` |
| `@mirelnan/domain/testing` | `createInMemoryRepositories(data)`, kept out of the main entry point              |

## Rules of the model

- **Strict objects:** every schema is `z.strictObject`, so an unknown key (a `phone` field, say) is rejected.
  Types come from `z.infer`, so the schema and the type cannot drift.
- **Identity is the slug.** References between entities are `<entity>Slug`; database ids never reach the
  domain.
- **Provenance:** every record that makes a claim has a `sourceSlug` pointing to a registered source
  ([ADR 0006](../../docs/adr/0006-content-sources-and-projects.md), [ADR 0008](../../docs/adr/0008-skills-matrix-source.md)).
- **Aggregates guard their own invariants** in the schema (`refine`/`superRefine`): an experience's phases lie
  inside its period, highlights and skills point to its own phases, the profile's intro is the opening of its
  summary. Rules across aggregates (a case study's experience exists) are checked by the `cv-data` tests and by
  foreign keys in the database.
- **Ports are read-only** and list only the methods a known consumer needs. A missing item is `null`.
  Consumers ask only for the ports they use (`Pick<Repositories, …>`).
- **No clock:** a rule that needs "today" takes it as a parameter, so it stays pure and testable.

## Scripts

`pnpm --filter @mirelnan/domain lint` · `typecheck` · `test` (Vitest, tests next to the code).
