# Mirel Nan — Portfolio

**Live: [mirelnan.dev](https://mirelnan.dev)**

My portfolio as a Senior Frontend Engineer, built from my CV. An AI layer is being added on top: a chat that will
answer questions about my experience only from sourced data, a job-match tool, and an MCP server that exposes the
same tools to any AI client.

It is a small site on purpose built like a large product: a layered monorepo, a typed data model with provenance
for every claim, and accessibility, security and SEO rules enforced by tooling and CI rather than promised.

## Features

| Feature                                                                                  | Status     |
| ---------------------------------------------------------------------------------------- | ---------- |
| Portfolio page rendered from Postgres, light / dark / system themes, keyboard-first      | ✅ live    |
| Experience timeline, skills with years from roles and projects, case studies             | ✅ live    |
| A skill filter with shareable links (`?skill=react`), section navigation, a share image  | ✅ live    |
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
  ([ADR 0006](docs/adr/0006-content-sources-and-projects.md), [ADR 0008](docs/adr/0008-skills-matrix-source.md),
  [ADR 0009](docs/adr/0009-personal-projects-in-skill-years.md)).
- **Data is generated and tested, not hand-edited.** Skills and their links to roles are generated from the CV;
  content tests reject unknown references, unlinked skills and anything that looks like a phone number.
- **Static by default.** The page is prerendered at build time from the database and served from the CDN; at run
  time only the dynamic AI routes will query it.
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

| Area      | Choice                                                                                                   |
| --------- | -------------------------------------------------------------------------------------------------------- |
| Monorepo  | pnpm workspaces, Turborepo, Node 26                                                                      |
| Web       | Next.js 16 (App Router, Cache Components), React 19, TypeScript, Tailwind CSS v4, shadcn/ui on Base UI   |
| Data      | PostgreSQL on Neon, Drizzle ORM, zod                                                                     |
| AI        | Claude API, Model Context Protocol (planned)                                                             |
| Quality   | ESLint (type-aware, jsx-a11y strict), Prettier, Vitest, Playwright + axe, commitlint, lefthook, gitleaks |
| CI / host | GitHub Actions, Vercel                                                                                   |

## How the chat is built to answer well

The chat is not live yet (🚧). It is built step by step, and each step is tested, measured or reviewed before the next
one starts. These are the decisions behind its answers.

**Grounding: it answers only from the data**

- The model answers only from what its tools return. Missing facts get the exact reply "not in the CV", never a guess
  from related skills.
- The tools are read-only and return only public CV data. Product descriptions and competencies (kept for search
  engines) never reach the model.
- Ownership is kept honest: work done as part of a team is never presented as owned, and years are rounded down
  ("more than 10 years"). The skills tool returns that phrase ready to repeat, not a number, so the model has no
  figure to round up or state as exact.

**The system prompt**

- One short prompt (about 3.5 KB), sent with every request. It sets the role, how tools are used, the reply format
  (plain text, at most five list items, English whatever the question's language), third-person references, the
  confidentiality reply word for word, and how to treat instructions typed by a visitor.
- Every rule has a test that fails if the rule is removed. A change to a rule is measured with the evaluations
  below before it is kept.

**Validation before the model is called**

- A request body is refused above 128 KB, before it is parsed. A visitor's question is limited to 1 000 characters,
  a conversation to 19 messages, and the roles must alternate. Unknown fields are refused.
- The assistant's earlier answers come back from the browser, so the server signs each one with HMAC-SHA256 (position,
  conversation and expiry are signed). A forged, moved, expired or foreign answer is dropped, not trusted
  ([ADR 0010](docs/adr/0010-signed-chat-turns.md)).

**Limits**

- At most six model requests per question (a question about several parts needs five tool rounds, measured), 800 output
  tokens per request and 20 seconds per request.
- Measured on Haiku 5.5: about $0.001 to $0.002 per question, and a few seconds.
- Per visitor: 5 questions a minute and 30 a day. If the rate limiter does not answer within 2 seconds, the chat
  refuses instead of running unchecked.
- A visitor who closes the page cancels the model request in flight, and no further round starts.
- The answer comes back whole, not streamed, because it is signed once it is complete.
- A per-request and a daily spending cap are planned before the chat goes live.

**Security**

- The API key is read on the server, on the first request, and checked for its prefix. It never reaches the browser,
  and the error for a missing key does not show its value.
- The evaluation runner refuses to run unless it connects with the read-only database role.
- A tool error goes to the model as an error, so the model can say it could not find something. The visitor gets a
  generic line; the technical cause goes to the server log only.

**Evaluations: the answers are measured, not assumed**

- 23 cases cover refusals, confidentiality, prompt injection in English and Romanian, ownership, rounded years,
  language, and questions with several parts. The grading is code: phrases, patterns, tool calls and search terms.
  No model judges another model's answer.
- A case that depends on the CV's data states the fact it relies on. The runner checks the fact in the database
  before asking the model. If the fact has changed, the case is reported as `STALE` and must be updated.
- Baseline: Haiku 5.5 passed 115 of 115 runs on all 23 cases (five repetitions, about eight cents). The first full run
  with the four multi-part cases passed 108 of 115. The failures were fixed by rules, and two false positives of the
  grader were corrected with tests: a fifth tool round needed a higher step limit, years written as "about 10 years"
  needed an explicit rule, a question about how something was delivered needed a rule to read the case study, and a
  pattern had flagged a refusal that named the product. Sonnet 5.5 was compared on the first
  19 cases: about 20 times the cost and one answer in Romanian despite the English rule, so Haiku is the default.
- A later single run stated "10 years" for a rounded-down figure. It was fixed in the data, not in the prompt: the
  skills tool now returns the phrase ("more than 10 years") instead of a number, and the case passed five runs out of
  five. Reading every answer of that run, not only the failures, showed a grader that was too loose: the case asking
  about cloud tools accepted any answer containing "cloud", including "the CV does not list any cloud tools", although
  the CV lists AWS and Vercel. The cause is a search that does not look at skill categories; it is the next fix.
- Every run records the answer, the tools called, the number of model requests, the cost and the time per question.
- Runs are repeated after each change to the prompt, the tools or the data, and periodically, to notice changes made
  by the model provider.

The decisions are recorded in [ADR 0010](docs/adr/0010-signed-chat-turns.md), and the evaluation workflow is in
[`apps/web/README.md`](apps/web/README.md#evaluations).

## Quality bars

**Accessibility — WCAG 2.2 AA, in both themes**

- ✅ `eslint-plugin-jsx-a11y` (strict) on every commit and in CI.
- ✅ A unit test checks the contrast of every colour pair the design uses, in light and dark.
- ✅ Skip link, visible focus that the sticky header never hides, reduced-motion and high-contrast support.
- ✅ Playwright + axe check every page against WCAG 2.2 AA in CI, in both themes, at desktop and phone sizes
  ([ADR 0004](docs/adr/0004-accessibility-wcag-2-2-aa.md)), and an [accessibility statement](https://mirelnan.dev/accessibility).

**Security — OWASP Top 10 and OWASP Top 10 for LLM applications**

- ✅ Security headers (HSTS, `nosniff`, Referrer-Policy, Permissions-Policy, no framing, Cross-Origin-Opener-Policy)
  from a tested function.
- ✅ A Content Security Policy that keeps the page static: same-origin only, no framing or plugins, inline scripts
  allowed because the prerendered page needs them ([ADR 0005](docs/adr/0005-security-baseline.md)).
- ✅ The app connects with a read-only database role; secrets are validated at startup and never echoed.
- ✅ CI with a frozen lockfile, `pnpm audit`, no install scripts, actions pinned to a commit SHA, read-only token.
- ✅ CodeQL, Dependabot with a 7-day release age, secret scanning with push protection, a protected `main`.
- ✅ Rate limiting on the API routes, per client address (Upstash).
- 🚧 Prompt-injection evaluations are in place for the chat; they grow with the chat's features.

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
└─ .github/workflows/       CI: lint, typecheck, unit tests, build and Playwright + axe against a throwaway Postgres
```

Each app, package and tooling folder has its own `README.md` with its API and rules; the site's is
[`apps/web/README.md`](apps/web/README.md). Code in `apps/web/src` is grouped by feature, not by file type.

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
