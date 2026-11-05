# 0002. Layered architecture with enforced boundaries

- Status: Accepted
- Date: 2026-11-05

## Context

The CV lives in Postgres and is read by the website, by the chat tools and by the MCP server. We want:

- business rules (for example, computing durations) that can be tested without a database;
- the option to swap the data source (in-memory data in tests, another database) without touching
  feature code;
- every Claude tool defined once and shared by the chat and the MCP server;
- UI code that cannot query the database directly.

Rules that exist only by convention erode, so boundaries must be checked by tools.

## Decision

Dependencies point inwards, towards `domain`:

    domain  ←  cv-data, db, ai  ←  apps/web, apps/mcp-server

- **`domain`** — entities, zod schemas, repository interfaces, pure rules. No I/O, no framework.
  One zod schema gives the TypeScript type, runtime validation and the JSON Schema for tools.
- **`db`** — Drizzle schema, Neon client, migrations, seed, and the repository implementations.
- **`cv-data`** — the CV as typed data, validated against the `domain` schemas; imported only by the seed.
- **`ai`** — Claude tools (zod schema plus handler) that receive repositories by injection.
- **apps** — feature code depends on repository interfaces; implementations are wired in one place,
  the composition root (`apps/web/src/server/container.ts`).

Boundaries are enforced at three levels:

1. **Packages** — only what a package lists in `exports` can be imported, and pnpm's strict
   `node_modules` blocks undeclared dependencies.
2. **TypeScript** — the `library` preset (`lib: ES2024`, `types: []`) has no DOM and no Node globals,
   so I/O in `domain` does not compile.
3. **ESLint** — `@mirelnan/eslint-config/library` forbids importing `db`/`ai`, database and API
   clients, `node:*` modules and React/Next.js from libraries. The `next` preset will forbid database
   imports in `apps/web/src/features`.

Modules that touch the database or secrets also import `server-only`.

## Alternatives considered

- **Feature folders only, no packages**: less setup, but every boundary is a convention.
- **Full clean or hexagonal architecture** (use-case classes, DTOs at every layer): too much ceremony
  for a read-mostly app. We keep the ports (repository interfaces) and skip a use-case layer until
  there is logic that needs one.
- **Apps import Drizzle directly**: the shortest path, but it couples the UI to the database schema
  and makes the AI tools impossible to share cleanly.

## Consequences

- (+) Rules and tools are tested with in-memory repositories, without a database.
- (+) One tool definition serves the chat and the MCP server.
- (+) Boundary violations fail `lint` or `typecheck` instead of relying on code review.
- (−) More indirection (interface, implementation, wiring) even for simple reads.
- (−) Database rows are mapped to domain entities in the repositories.
