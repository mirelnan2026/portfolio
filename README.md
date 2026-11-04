# Mirel Nan — Portfolio

Personal portfolio built from my CV, with an AI layer on top:

- **Portfolio** — experience timeline, highlights, skills and projects, rendered from a Postgres database.
- **Ask about me** — a chat with Claude that answers only from my CV through tool use (it never invents experience).
- **Job match** — paste a job description, get a structured fit analysis with evidence from the CV.
- **MCP server** — the same CV tools exposed to any MCP client (Claude Desktop, Claude Code).

Built to **WCAG 2.2 AA**, in light and dark themes, and to the **OWASP** security baselines —
both enforced by tooling and tests, not only promised.

> Status: stage 0 — foundation and portfolio page.

## Tech stack

| Area | Choice |
|---|---|
| Monorepo | pnpm workspaces + Turborepo |
| Web | Next.js (App Router), React, TypeScript, Tailwind CSS v4, shadcn/ui |
| Data | PostgreSQL on Neon, Drizzle ORM |
| Rate limiting | Upstash Redis (`@upstash/ratelimit`) |
| AI | Claude API (`@anthropic-ai/sdk`), Model Context Protocol (`@modelcontextprotocol/sdk`) |
| Quality | ESLint, Prettier, Vitest, Playwright, Conventional Commits (commitlint + lefthook) |
| Accessibility | `eslint-plugin-jsx-a11y`, `@axe-core/playwright`, Lighthouse CI, Radix primitives (via shadcn/ui) |
| Security | Security headers + CSP, zod input validation, gitleaks, CodeQL, Dependabot |
| Hosting | Vercel |

## Project structure

```
portfolio/
├─ apps/                    Deployable applications
│  ├─ web/                  Next.js site and API routes (Vercel)
│  └─ mcp-server/           MCP server exposing the CV tools (stdio)
├─ packages/                Internal libraries, consumed by the apps
│  ├─ domain/               Entities, zod schemas, repository interfaces, pure business rules
│  ├─ cv-data/              The CV content as typed data — the single source of truth
│  ├─ db/                   Drizzle schema, Neon client, migrations, seed, repository implementations
│  └─ ai/                   Claude tools, prompts and job-match logic, shared by chat and MCP
├─ tooling/                 Shared configuration, published as workspace packages
│  ├─ typescript/           tsconfig presets (base, library, nextjs, node)
│  ├─ eslint/               ESLint presets + layer-boundary rules
│  └─ prettier/             Prettier config
├─ docs/adr/                Architecture Decision Records
└─ .github/workflows/       CI: lint, typecheck, test, build
```

### Why `apps/`, `packages/` and `tooling/`

- **`apps/`** contains things that are deployed or executed. Each one is a composition of packages
  plus its own entry point (routes, CLI).
- **`packages/`** contains reusable code with a clear public API (`exports` in `package.json`).
  A new app (e.g. an admin panel or a Slack bot) can reuse them without copying code.
- **`tooling/`** contains configuration only. Every package extends it in one line, so rules
  are changed in one place.

### Layers and dependency direction

```
            ┌──────────────┐
            │    domain    │   types, schemas, rules — no I/O
            └──────▲───────┘
       ┌───────────┼────────────┐
┌──────┴─────┐ ┌───┴────┐ ┌─────┴────┐
│  cv-data   │ │   db   │ │    ai    │
└────────────┘ └───▲────┘ └────▲─────┘
                   │           │
            ┌──────┴───────────┴──────┐
            │ apps/web, apps/mcp-server│
            └─────────────────────────┘
```

- Dependencies point **inwards, towards `domain`**. `domain` depends on nothing in the repo.
- `domain` defines repository **interfaces** (`ExperienceRepository`, …); `db` implements them with Drizzle.
  Apps depend on the interfaces, and wire the implementations in one place
  (`apps/web/src/server/container.ts`). Swapping the database or testing with in-memory data
  does not touch feature code.
- `cv-data` is used only by the seed script: the CV is written once as typed data,
  validated against the `domain` schemas, then loaded into Postgres.
- `ai` defines each Claude tool once (zod schema + handler); the web chat and the MCP server both use it.
- Boundaries are enforced by package `exports` and ESLint import rules, not only by convention.

### Inside `apps/web/src`

```
app/                 Routing only: pages, layouts, API route handlers, metadata
features/<feature>/  Everything for one feature: components, hooks, server code, queries
  portfolio/         Hero, highlights, experience timeline, skills, projects
  chat/              "Ask about me" (stage 1–2)
  job-match/         Job description → structured fit analysis (stage 2)
components/ui/       shadcn/ui primitives (generated)
components/layout/   Header, footer, theme toggle
lib/                 env validation, rate limiting, small utilities
server/              Composition root: creates repositories and services
```

Code is grouped **by feature, not by file type**: deleting or moving a feature means touching one folder.

## Conventions

- Package scope `@mirelnan/*`; files and folders in `kebab-case`; React components in `PascalCase`;
  hooks named `use-*.ts`; tests next to the code as `*.test.ts`.
- Database: plural `snake_case` tables and columns, foreign keys `<entity>_id`; `camelCase` in TypeScript.
- Claude tools: `verb_noun` in `snake_case` (`get_profile`, `search_cv`).
- API routes: `kebab-case` nouns (`/api/job-match`).
- Commits follow [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `chore:` …).
- Architecture decisions are recorded in `docs/adr/`.

## Accessibility

Target: **WCAG 2.2 level AA** across the whole site, in both light and dark themes.

### How it is enforced

| Layer | Tool | Catches problems |
|---|---|---|
| Editor and commit | `eslint-plugin-jsx-a11y` (strict) | While typing, and before every commit (lefthook) |
| Automated tests | `@axe-core/playwright` on every page, light and dark | In CI — any violation fails the build |
| E2E tests | Queries by role and accessible name (`getByRole`) | An unlabeled control cannot even be tested |
| Audit | Lighthouse CI on Vercel previews (Accessibility = 100) | On every pull request |
| Manual | Keyboard only, Orca screen reader, 400% zoom, forced colors | For every new section |

### Implementation rules

- Semantic HTML first; ARIA only where HTML is not enough. One `h1`, no skipped heading levels.
- Fully operable by keyboard: logical focus order, visible focus, skip link, focus never hidden by the sticky header.
- Text contrast ≥ 4.5:1 (≥ 3:1 for large text and UI parts), checked for every color token in both themes.
- Click targets ≥ 24×24px; content reflows at 320px width and 400% zoom without horizontal scrolling.
- Respects `prefers-reduced-motion`, `prefers-contrast` and `forced-colors`.
- State is never conveyed by color alone (e.g. a selected skill also has `aria-pressed` and a visible marker).
- Dialogs, menus and tabs use Radix primitives, which manage focus and ARIA correctly.
- The chat announces streamed answers once, when complete, through an `aria-live="polite"` region.

The accessibility statement (standard, testing method, known limitations, contact) is published at `/accessibility`.

## Security

Baseline: **OWASP Top 10** and the **OWASP Top 10 for LLM Applications**, applied as defense in depth.

| Layer | Measures |
|---|---|
| HTTP | Content Security Policy, HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `frame-ancestors 'none'` (target: Mozilla Observatory A+) |
| API | zod validation of every input (types and max lengths), rate limiting on every `/api/*` route, generic error responses |
| Secrets | Validated at startup, server-only modules, never exposed via `NEXT_PUBLIC_`; gitleaks pre-commit hook and GitHub push protection |
| AI | User input treated as untrusted (prompt injection); read-only tools over public CV data only; token and conversation limits; model output rendered as text; spend limit on the API key |
| Database | Read-only role for the app, separate role for migrations and seed; TLS; parameterized queries only (Drizzle) |
| Supply chain | Frozen lockfile in CI, `pnpm audit`, Dependabot, minimum release age for new versions, install scripts allow-listed, GitHub Actions pinned to commit SHA with minimal permissions |
| Repository | Protected `main` (pull request + green CI), CodeQL scanning, protected preview deployments |
| Privacy | No tracking cookies, no third-party scripts |

Security headers are checked by an end-to-end test, and prompt-injection attempts are part of the AI evaluations.
Vulnerabilities can be reported as described in [`SECURITY.md`](SECURITY.md) (also at `/.well-known/security.txt`).

## Getting started

Requirements: Node 24 (`nvm use`), pnpm 12 (`corepack enable`).

```bash
pnpm install
cp .env.example apps/web/.env.local   # fill in the values
pnpm db:migrate && pnpm db:seed       # once the db package is ready
pnpm dev
```

| Script | What it does |
|---|---|
| `pnpm dev` | Runs all apps in development mode |
| `pnpm build` | Builds everything, in dependency order, with Turborepo caching |
| `pnpm lint` / `pnpm typecheck` / `pnpm test` | Quality checks across the workspace (lint includes accessibility rules) |

## Environment variables

Secrets live only in `.env.local` (git-ignored) and in the Vercel project settings.
`.env.example` lists every variable without values.

| Variable | Used for |
|---|---|
| `DATABASE_URL` | Neon Postgres connection |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Rate limiting |
| `ANTHROPIC_API_KEY` | Claude API (from stage 1) |

## Content rules

- Personal contributions come only from the CV. Product descriptions are public context, linked to their source.
- No phone number anywhere in the repository.

## Roadmap

0. Foundation and portfolio page
1. Claude API — streaming chat
2. Tool use and structured output — grounded chat, job match
3. MCP server
4. Claude Code workflow — commands, hooks, PR review
