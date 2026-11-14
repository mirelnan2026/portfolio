# Mirel Nan — Portfolio

**Live: [mirelnan.dev](https://mirelnan.dev)**

My portfolio as a Senior Frontend Engineer, built from my CV, with an AI layer on top: a chat that answers
questions about my experience only from sourced data, a job-match tool, and an MCP server that exposes the same
tools to any AI client.

It is a small site on purpose built like a large product: a layered monorepo, a typed data model with provenance
for every claim, and accessibility, security and SEO rules enforced by tooling and CI rather than promised.

## Features

| Feature                                                                                  | Status     |
| ---------------------------------------------------------------------------------------- | ---------- |
| Portfolio page rendered from Postgres, light / dark / system themes, keyboard-first      | ✅ live    |
| Experience timeline, skills with years per skill (computed from the data), case studies  | ✅ live    |
| **Ask about me** — a Claude chat grounded in the CV through tool use, with source links  | 🚧 planned |
| **Job match** — paste a job description, get requirement → evidence → level              | 🚧 planned |
| **MCP server** — the same CV tools for Claude Desktop, Claude Code and other MCP clients | 🚧 planned |

## Architecture highlights

- **Modular monolith, layers with ports and adapters.** `domain` holds the model and the repository interfaces;
  `db` implements them with Drizzle; the apps wire everything in one composition root. Dependencies point inwards,
  and ESLint fails the build when an import crosses a layer
  ([ADR 0001](docs/adr/0001-monorepo-layout.md), [ADR 0002](docs/adr/0002-layered-architecture.md)).
- **Every claim has a source.** Each record about me points to a registered source (the CV, a brief, a skills
  matrix), and the AI features will answer only from that data
  ([ADR 0006](docs/adr/0006-content-sources-and-projects.md), [ADR 0008](docs/adr/0008-skills-matrix-source.md)).
- **Data is generated and tested, not hand-edited.** Skills and their links to roles are generated from the CV;
  content tests reject unknown references, unlinked skills and anything that looks like a phone number.
- **Static by default.** The page is prerendered at build time from the database and served from the CDN;
  the database only gets queries from the dynamic AI routes.
- **One set of AI tools.** The chat and the MCP server will share the same tool definitions (zod schema + handler).

```
            ┌──────────────┐
            │    domain    │   model, zod schemas, repository interfaces — no I/O
            └──────▲───────┘
       ┌───────────┼────────────┐
┌──────┴─────┐ ┌───┴────┐ ┌─────┴────┐
│  cv-data   │ │   db   │ │    ai    │
└────────────┘ └───▲────┘ └────▲─────┘
                   │           │
            ┌──────┴───────────┴───────┐
            │ apps/web, apps/mcp-server │
            └───────────────────────────┘
```

The tables, their relations and the rules the database enforces are in
[`packages/db/README.md`](packages/db/README.md) (an ER diagram that GitHub renders).

## Tech stack

| Area      | Choice                                                                                                 |
| --------- | ------------------------------------------------------------------------------------------------------ |
| Monorepo  | pnpm workspaces, Turborepo, Node 26                                                                    |
| Web       | Next.js 16 (App Router, Cache Components), React 19, TypeScript, Tailwind CSS v4, shadcn/ui on Base UI |
| Data      | PostgreSQL on Neon, Drizzle ORM, zod                                                                   |
| AI        | Claude API, Model Context Protocol (planned)                                                           |
| Quality   | ESLint (type-aware, jsx-a11y strict), Prettier, Vitest, commitlint, lefthook, gitleaks                 |
| CI / host | GitHub Actions, Vercel                                                                                 |

## Quality bars

**Accessibility — WCAG 2.2 AA, in both themes**

- ✅ `eslint-plugin-jsx-a11y` (strict) on every commit and in CI.
- ✅ A unit test checks the contrast of every colour pair the design uses, in light and dark.
- ✅ Skip link, visible focus that the sticky header never hides, reduced-motion and high-contrast support.
- 🚧 Playwright + axe on every page in both themes, Lighthouse CI, an accessibility statement.

**Security — OWASP Top 10 and OWASP Top 10 for LLM applications**

- ✅ Security headers (HSTS, `nosniff`, Referrer-Policy, Permissions-Policy, no framing) from a tested function.
- ✅ A Content Security Policy that keeps the page static: same-origin only, no framing or plugins, inline scripts
  allowed because the prerendered page needs them ([ADR 0005](docs/adr/0005-security-baseline.md)).
- ✅ The app connects with a read-only database role; secrets are validated at startup and never echoed.
- ✅ CI with a frozen lockfile, `pnpm audit`, no install scripts, actions pinned to a commit SHA, read-only token.
- ✅ CodeQL, Dependabot with a 7-day release age, secret scanning with push protection, a protected `main`.
- 🚧 Rate limiting on the API routes, prompt-injection evaluations (with the AI features).

**SEO**

- ✅ Metadata generated from the data (the build fails if a title or description would be cut), one canonical
  origin, `robots.txt`, `sitemap.xml`, a real 404, previews never indexed.
- ✅ JSON-LD `ProfilePage`, a share image drawn from the data, `/llms.txt` for AI search
  ([ADR 0007](docs/adr/0007-seo-baseline.md)).

## Project structure

```
portfolio/
├─ apps/
│  ├─ web/                  Next.js site and API routes (Vercel)
│  └─ mcp-server/           MCP server exposing the CV tools (planned)
├─ packages/
│  ├─ domain/               Entities, zod schemas, repository interfaces, pure rules
│  ├─ cv-data/              The CV as typed data, plus the generators that keep it in sync
│  ├─ db/                   Drizzle schema, migrations, seed, repository implementations
│  └─ ai/                   Claude tools and prompts, shared by the chat and MCP (planned)
├─ tooling/                 Shared TypeScript, ESLint and Prettier presets
├─ docs/adr/                Architecture Decision Records
└─ .github/workflows/       CI: lint, typecheck, test and build against a throwaway Postgres
```

Each package and tooling folder has its own `README.md` with its API and rules. Code in `apps/web/src` is grouped
by feature, not by file type.

## Running it locally

Requirements: Node 26 (`nvm use`), pnpm 12 (Node 26 no longer ships Corepack:
`npm install -g corepack && corepack enable pnpm`), [gitleaks](https://github.com/gitleaks/gitleaks) on your
`PATH` for the pre-commit hook, and a Postgres database (Neon or local).

```bash
pnpm install
cp apps/web/.env.example apps/web/.env.local       # DATABASE_URL, read-only role (see packages/db/README.md)
cp packages/db/.env.example packages/db/.env.local # DATABASE_ADMIN_URL, for migrations and the seed
pnpm --filter @mirelnan/db db:migrate && pnpm --filter @mirelnan/db db:seed
pnpm dev
```

| Script                                       | What it does                                                   |
| -------------------------------------------- | -------------------------------------------------------------- |
| `pnpm dev`                                   | Runs the apps in development mode                              |
| `pnpm build`                                 | Builds everything, in dependency order, with Turborepo caching |
| `pnpm lint` / `pnpm typecheck` / `pnpm test` | Quality checks across the workspace                            |
| `pnpm format` / `pnpm format:check`          | Formats the repository with Prettier / checks it (used in CI)  |

Commits follow [Conventional Commits](https://www.conventionalcommits.org/); git hooks run gitleaks, Prettier and
ESLint before each commit, and CI runs every check again.

How the site is operated (deploys, data changes, credential rotation, rollbacks) is in
[`docs/runbook.md`](docs/runbook.md); how to report a vulnerability is in [`SECURITY.md`](SECURITY.md).

## Licence

All rights reserved: the code and the content can be read here, but not reused. See [`LICENSE`](LICENSE).
