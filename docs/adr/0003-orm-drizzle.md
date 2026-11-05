# 0003. Drizzle ORM for data access

- Status: Accepted
- Date: 2026-11-05

## Context

The data lives in PostgreSQL on Neon (serverless) and is read from Vercel functions. The schema is
small and the app is read-mostly. Data access is isolated in `packages/db` behind the repository
interfaces from `domain` (ADR 0002). We need:

- types that flow from the schema into TypeScript;
- versioned, reviewable migrations;
- a client that works well in serverless functions;
- queries that are always parameterized.

## Decision

Use **Drizzle ORM** with **drizzle-kit**.

- The schema is written in TypeScript (`packages/db/src/schema`); types are inferred, with no code
  generation step.
- `casing: "snake_case"`: fields are `camelCase` in TypeScript and `snake_case` in the database.
- The Neon serverless driver is used for connections.
- Migrations: `drizzle-kit generate` creates SQL files, which are committed and reviewed, then
  `drizzle-kit migrate` applies them. `drizzle-kit push` is never used against production.
- Queries go through the query builder or the `sql` template tag, so values are always sent as
  parameters, never concatenated.
- The app connects with a read-only role; migrations and the seed use a separate role.
- Drizzle types stay inside `packages/db`; other packages only see `domain` entities.

## Alternatives considered

- **Prisma**: mature, with excellent tooling, but it uses its own schema language and a generate
  step, and its query API is further from SQL.
- **Kysely**: an excellent type-safe query builder, but it has no schema definition or migration
  generation; types would have to be written by hand or generated.
- **Raw SQL** (Neon driver or `postgres.js`): full control, but no types without extra tooling.
- **TypeORM**: decorator-based entities and weaker type inference.

## Consequences

- (+) Queries read like SQL, so the code shows what runs in the database.
- (+) A light client that fits serverless functions.
- (+) Migrations are plain SQL files that can be reviewed in a pull request.
- (−) Fewer guardrails than Prisma; relations must be declared explicitly.
- (−) The API still changes between major versions, so versions are pinned and changelogs read
  before upgrading.
- Replacing the ORM means rewriting `packages/db` only, because the rest of the code depends on the
  repository interfaces.
