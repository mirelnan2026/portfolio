# CLAUDE.md

Guidance for Claude Code when working in this repository.

## What this is

Personal portfolio for Mirel Nan (Senior Frontend Engineer), built from the CV, plus:
an "Ask about me" chat with Claude using tool use (must never invent experience), a job-match feature
with structured output, and an MCP server exposing the CV. Stages follow Anthropic Academy:
0 foundation + portfolio page → 1 Claude API → 2 tool use + structured output → 3 MCP → 4 Claude Code.
Full plan: (a local file).

## Architecture

pnpm workspaces + Turborepo. `apps/` = deployables, `packages/` = libraries, `tooling/` = shared config.

```
apps/web           @mirelnan/web         Next.js App Router, React, TS, Tailwind v4, shadcn/ui (Vercel)
apps/mcp-server    @mirelnan/mcp-server  MCP server (stdio), stage 3
packages/domain    @mirelnan/domain      entities + zod schemas, repository interfaces, pure rules. No I/O.
packages/cv-data   @mirelnan/cv-data     cv.ts — single source of truth for CV content (used by seed only)
packages/db        @mirelnan/db          Drizzle schema, Neon client, migrations, seed, repository implementations
packages/ai        @mirelnan/ai          tool definitions, prompts, job-match (stage 1+)
tooling/*          @mirelnan/tsconfig, @mirelnan/eslint-config, @mirelnan/prettier-config
docs/adr           Architecture Decision Records
```

Dependency direction (one way only): `domain` ← `cv-data`, `db`, `ai` ← `apps/*`.
- Apps never import `drizzle-orm` directly; they use repository interfaces from `domain`,
  wired in `apps/web/src/server/container.ts` (composition root).
- Packages expose only what is listed in `exports` in their `package.json` (no deep imports).
- Modules touching the DB or secrets import `server-only`.
- `apps/web/src`: `app/` is routing only; feature code lives in `features/<feature>/`;
  shadcn components in `components/ui/`; layout pieces in `components/layout/`.
- AI tools are shared by the chat and the MCP server — defined once in `@mirelnan/ai`.

## Conventions

- npm scope `@mirelnan/*`. Files and folders kebab-case; React components PascalCase; hooks `use-*.ts`; tests next to code as `*.test.ts`.
- DB: plural snake_case tables, snake_case columns, FK `<entity>_id`; camelCase in TS (Drizzle `casing: 'snake_case'`).
- AI tool names: verb_noun snake_case (`get_profile`, `search_cv`). API routes: kebab-case nouns (`/api/job-match`).
- TypeScript `strict` + `noUncheckedIndexedAccess`. Conventional Commits (commitlint + lefthook).
- Migrations via `drizzle-kit generate` + `migrate` (never `push` against production). Seed is idempotent.
- UI: light + dark + system themes via `next-themes`; colors only through CSS tokens (no hardcoded colors);
  WCAG 2.2 AA; no invented metrics, no skill progress bars.

## Content rules

- **Never include the phone number** anywhere (data, seed, UI, PDFs, fixtures). The `Profile` type has no `phone` field.
- Personal contributions come **only** from the CV text. Product/industry descriptions (JWX Dashboard, Res_Q, HPI Check)
  are public context with `source_url`, never evidence of contributions; no vendor marketing numbers, no logos.
- The chat and job-match must answer only from tool results and say "not in the CV" otherwise.

## Secrets

Only in `.env.local` (git-ignored) and Vercel project settings. `.env.example` documents every variable.
Variables: `DATABASE_URL`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `ANTHROPIC_API_KEY` (stage 1+).

## Commands

To be filled in as the root `package.json` scripts are written (`pnpm dev`, `pnpm build`, `pnpm lint`,
`pnpm typecheck`, `pnpm test`, `pnpm db:generate`, `pnpm db:migrate`, `pnpm db:seed`).
