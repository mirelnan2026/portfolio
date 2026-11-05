# 0001. Monorepo layout: pnpm workspaces and Turborepo

- Status: Accepted
- Date: 2026-11-05

## Context

The portfolio has two programs that run on their own — the Next.js site and the MCP server — and both
need the same CV data model, the same database access and the same Claude tools. More consumers may
follow (an admin panel, a chat bot). We need to:

- share code without publishing packages to a registry;
- change shared code and all of its consumers in a single commit;
- keep one set of tooling rules (TypeScript, ESLint, Prettier) for every package;
- keep CI fast as the repository grows.

## Decision

- One repository, with **pnpm workspaces** for linking packages and **Turborepo** for running and
  caching tasks (`lint`, `typecheck`, `test`, `build`).
- Three top-level folders, split by role:
  - `apps/` — things that are deployed or executed: `web`, `mcp-server`. The MCP server is an app,
    not a package, because it is run, not imported.
  - `packages/` — libraries with a public API declared in `exports`: `domain`, `cv-data`, `db`, `ai`.
  - `tooling/` — shared configuration only (`typescript`, `eslint`, `prettier`), consumed as
    workspace packages, so every package extends it in one line.
- Every package is private, scoped `@mirelnan/*`, and linked with `workspace:*`.
- Internal packages are consumed from their TypeScript source, without a build step. Next.js compiles
  them through `transpilePackages`; only `mcp-server` is bundled (tsup), because it runs on Node.
- Third-party versions used by several packages live in the pnpm catalog (`catalog:`).

## Alternatives considered

- **Polyrepo** (one repository per package, published versions): a change across packages becomes
  several pull requests plus a release; too much overhead for a single maintainer.
- **A single Next.js app with folders**: the simplest option, but the MCP server would import from
  inside the web app, and boundaries would exist only by convention.
- **Nx**: richer generators, project graph and module-boundary rules, but more configuration and
  concepts than this project needs; Turborepo plus ESLint rules cover the same needs here.
- **npm or Yarn workspaces**: pnpm's strict `node_modules` prevents phantom dependencies (importing a
  package that is not declared), and it adds catalogs and an allow-list for install scripts.

## Consequences

- (+) A schema change and all of its consumers ship in one pull request; `typecheck` shows every break.
- (+) Turborepo caches task results by their inputs, so CI only reruns what changed.
- (+) A new app reuses the packages instead of copying code.
- (−) More files per package (`package.json`, `tsconfig.json`, ESLint config).
- (−) Source-consumed packages are compiled by every consumer; acceptable at this size, to be
  revisited (compiled packages) if build times grow.
- (−) Vercel must be configured for a monorepo (Root Directory `apps/web`).
