# CLAUDE.md

Guidance for Claude Code when working in this repository.

## What this is

Personal portfolio for Mirel Nan (Senior Frontend Engineer), built from the CV, plus:
an "Ask about me" chat with Claude using tool use (must never invent experience), a job-match feature
with structured output, and an MCP server exposing the CV. Stages follow Anthropic Academy:
0 foundation + portfolio page → 1 Claude API → 2 tool use + structured output → 3 MCP → 4 Claude Code.
Full plan: (a local file).

## Architecture

**Modular monolith** with a single architectural style: layers with ports and adapters (Clean/hexagonal family).
One repo, one data model, one database, shipped as two apps. `domain` holds the model and the ports (repository
interfaces); `db` is the outbound adapter; `ai` holds the use cases (Claude tools); `apps/*` are inbound adapters
(HTTP, MCP) plus the composition root. Inside each package the folder layout fits its role (domain by role,
db by tool, ai by capability, web by feature); the package template and the dependency rule are the same everywhere.
Not microservices — split a part out only if it needs its own scaling, deploy cadence or data.

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
- TypeScript `strict` + `noUncheckedIndexedAccess`.
- Conventional Commits, enforced by commitlint in the `commit-msg` hook: header ≤ 72 chars; scope optional but
  one of `web`, `mcp-server`, `domain`, `cv-data`, `db`, `ai`, `tooling`, `ci`, `deps` (`commitlint.config.mjs`).
  A new package means a new scope. `docs:` for prose only, `chore(tooling):` for shared tool config,
  `build:` for dependencies and build orchestration.
- Migrations via `drizzle-kit generate` + `migrate` (never `push` against production). Seed is idempotent.
- UI: light + dark + system themes via `next-themes`; colors only through CSS tokens (no hardcoded colors);
  no invented metrics, no skill progress bars. English only (`<html lang="en">`).

## Accessibility (first-class requirement)

Target **WCAG 2.2 AA**, in both themes. Every code review checks accessibility.

- Enforced by tooling: `eslint-plugin-jsx-a11y` (strict), `@axe-core/playwright` on every page in light and dark
  (violations fail CI), Lighthouse Accessibility = 100. E2E tests query by role/accessible name (`getByRole`).
- Semantic HTML first, ARIA only where HTML is not enough; one `h1`, no skipped heading levels.
- Full keyboard support, visible focus (`:focus-visible`), skip link, focus never hidden by the sticky header.
- Contrast ≥ 4.5:1 for text (≥ 3:1 for large text and UI parts); targets ≥ 24×24px; reflow at 320px / 400% zoom.
- Respect `prefers-reduced-motion`, `prefers-contrast`, `forced-colors`. Never convey state by color alone.
- Use Radix primitives (via shadcn/ui) for dialogs, menus, tabs — don't hand-roll them.
- Streaming chat output goes through an `aria-live="polite"` region; dialogs move and restore focus.

## Responsive (first-class requirement)

UI and UX must work on every device: phone, tablet, laptop, large desktop, portrait and landscape. Use the
modern approach: mobile-first CSS with intrinsic, fluid layouts. Desktop gets the most visitors, so every
breakpoint is designed on purpose. Desktop is never a stretched phone layout.

- Mobile-first CSS: unprefixed Tailwind classes target small screens; `sm:`/`md:`/`lg:`/`xl:` add the larger layouts.
- Intrinsic layouts: flexbox/grid with `minmax()`, `auto-fit`, `gap`; breakpoints follow the content, not device names.
- Container queries (`@container`) for components (cards, highlights), so a component adapts to its slot.
- Fluid type and spacing with `clamp()`; `rem` units; readable line length (`max-w-prose`); no fixed heights.
- Works from 320px wide with no horizontal scroll, up to wide screens (content max width, no edge-to-edge text).
- Large screens keep their density: full navigation, two-column timeline, grids. Small screens: the section
  menu becomes a shadcn `Sheet` below `md`, the timeline becomes one column, tables (job match) become stacked
  cards, the chat panel opens full screen.
- Touch: larger targets (≥ 44×44px) only for coarse pointers (`pointer: coarse`), so desktop controls stay
  compact; WCAG 24×24px applies everywhere. Nothing works only on hover; inputs ≥ 16px font (no iOS zoom).
- `dvh` units and `env(safe-area-inset-*)` for full-height and fixed elements; `next/image` with `sizes`.
- Verified by Playwright projects for desktop and phone viewports (smoke + axe on both), Lighthouse with both
  the desktop and mobile presets, and a manual check on a real phone.

## Security (first-class requirement)

Baseline: OWASP Top 10 + OWASP Top 10 for LLM Applications. Every code review checks security.

- **HTTP headers** (set in `next.config.ts` / `proxy.ts`): CSP (`default-src 'self'`, `frame-ancestors 'none'`,
  `object-src 'none'`, `base-uri 'self'`), HSTS, `X-Content-Type-Options: nosniff`,
  `Referrer-Policy: strict-origin-when-cross-origin`, restrictive `Permissions-Policy`. Nonce vs hash CSP is decided at step 4
  (nonces force dynamic rendering, which conflicts with ISR). Target: Mozilla Observatory A+.
- **Input**: every API input validated with zod (types + max lengths) at the boundary; body size limits;
  rate limiting (Upstash) on every `/api/*` route; generic error messages, no stack traces to the client.
- **Secrets**: validated at startup (`lib/env.ts`); never `NEXT_PUBLIC_`; modules using them import `server-only`;
  gitleaks in lefthook + GitHub secret scanning with push protection.
- **AI**: the user's text and job descriptions are untrusted (prompt injection). Tools are **read-only** and only
  return public CV data; no secrets or private data in prompts; `max_tokens` and conversation length capped;
  model output rendered as text/sanitized markdown (never `dangerouslySetInnerHTML`); job-match output validated
  with zod; spend limit set in the Anthropic console.
- **Database**: the runtime uses a read-only Postgres role; migrations/seed use a separate role; TLS required;
  queries only through Drizzle (parameterized), no string-built SQL.
- **Supply chain**: frozen lockfile in CI, `pnpm audit`, Dependabot, pnpm `minimumReleaseAge`, install scripts
  allowed only via `onlyBuiltDependencies`; GitHub Actions pinned to commit SHA with minimal `permissions:`.
- **Repo / platform**: protected `main` (PR + green CI), CodeQL, Vercel Deployment Protection on previews,
  `SECURITY.md` + `/.well-known/security.txt`.
- **Privacy**: no tracking cookies (cookieless analytics only), no third-party scripts without a reason.

## Content rules

### Approved sources

Personal contributions come **only** from:

1. the CV — (a local file);
2. the interview brief — (a local file) (owner's own notes): the three JWX
   phases, the four case studies, owned vs contributed, "Technical range" context notes, the AI workflow.

Every record in `cv-data` carries `source: "cv" | "interview-brief"`. Never add a claim without a source.

### Product context

Product/industry descriptions (JWX Dashboard, Res_Q, HPI Check) are public context with `source_url`, never
evidence of contributions; no vendor marketing numbers, no logos. JWX phases 01–02 have no public product:
describe them generically ("video advertising platform", "content management suite").
Product descriptions are shown **on the site only** (product cards): AI tools never return them, so the chat,
job match and MCP server cannot use them (owner decision, 2026-11-05).

### Ownership

Highlights carry `ownership: "owned" | "contributed"`. Owned: metering & billing, the AI media-transformation
frontend, both framework upgrades, the shared-library extraction. Never present `contributed` as
`owned`, never claim a whole product.

### Confidentiality (applies to site, data, chat, job match, MCP)

- No internal ticket IDs, branch names or repository links.
- No internal product codenames, no feature-flag names.
- No unreleased roadmap, no business figures (revenue, customer counts, pricing).
- No architecture detail precise enough to reproduce — describe the shape of the problem, not the internals.
- Client codebases ((a local folder), (a local folder), (a local folder)) are **not** a content source.
- The chat declines such requests with: "That's covered by a confidentiality agreement, so I can describe the
  shape of the problem instead."

### Always

- **Never include the phone number** anywhere (data, seed, UI, PDFs, fixtures). The `Profile` type has no `phone` field.
  The only CV PDF allowed in the repo is the no-phone export
  ((a local file) → `apps/web/public/mirel-nan-cv.pdf`);
  re-check any new export for phone traces (text, `tel:` links, metadata) before committing it.
- The chat, job match and MCP server answer **only** from the CV and the interview brief (through tool results),
  with the exclusions and confidentiality rules above applied, and say "not in the CV" otherwise — never from the
  model's general knowledge or from product pages.

## Secrets

Only in `.env.local` (git-ignored) and Vercel project settings. `.env.example` documents every variable.
Variables: `DATABASE_URL`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `ANTHROPIC_API_KEY` (stage 1+).

## Tooling decisions

- Shared versions live in the pnpm **catalog** (`pnpm-workspace.yaml`); packages use `"catalog:"`.
  Internal packages use `workspace:*`. Tool-config packages declare the tool as a `peerDependency`.
- **TypeScript 6.0.x**, not 7: Next.js, typescript-eslint and drizzle-kit need the JS compiler API.
- **ESLint 10** (v9 is EOL since 2026-08-06). Plugins that still use removed APIs (e.g. `eslint-plugin-react`,
  `jsx-a11y` via `eslint-config-next`) get wrapped with `@eslint/compat` `fixupPluginRules()` at step 4.
- Before picking any version: check latest, **support/EOL status** and peer ranges; test in a scratch dir if unsure.
- Dependency install scripts are blocked by pnpm; decisions are recorded in `allowBuilds` in
  `pnpm-workspace.yaml` (`lefthook: false` — hooks are installed by our own root `prepare` script instead).
- Prettier runs once from the root (not via Turbo); ESLint and `tsc` run per package via Turbo.
  Tool-managed files (`pnpm-lock.yaml`, `pnpm-workspace.yaml`) are in `.prettierignore`.
- Git hooks (`lefthook.yml`): pre-commit = gitleaks on staged diff, then Prettier on staged files (`piped`);
  commit-msg = commitlint. ESLint on staged files is added once packages have `eslint.config.js`.
  Hooks are a convenience, not a control — CI re-runs everything.
- gitleaks is a system binary (`~/.local/bin`, installed from the official release with checksum check), not an npm package.
- **Package template** (set by `packages/domain`): `exports` points at TS source (`./src/index.ts`, no build),
  `sideEffects: false`, scripts `lint: eslint .`, `typecheck: tsc`, `test: vitest run`; `tsconfig.json` extends a
  preset with `include: ["src"]`; `eslint.config.js` extends a preset and sets `tsconfigRootDir: import.meta.dirname`
  (needed when ESLint runs over several packages at once). `index.ts` lists public exports by name (no `export *`).
- **Vitest 5** for unit tests: explicit `import { describe, it, expect } from "vitest"` (no globals, so library
  packages need no extra `types`), tests next to the code, table-driven with `it.each`; test through the public API.
  Turbo `test` has no outputs until coverage is enabled in CI.
- `--save-catalog` only for external packages; never in the same `pnpm add` as `workspace:*` packages.

## Commands

| Command                                                                  | What it does                                                                             |
| ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| `pnpm install`                                                           | install; on a fresh clone also runs `prepare` → `lefthook install`                       |
| `pnpm run prepare`                                                       | (re)install git hooks — pnpm 12 skips `prepare` when the install is "Already up to date" |
| `pnpm format` / `pnpm format:check`                                      | Prettier write / check over the whole repo (CI uses `check`)                             |
| `pnpm lint` / `pnpm typecheck` / `pnpm test` / `pnpm build` / `pnpm dev` | Turbo tasks across packages                                                              |
| `pnpm exec lefthook validate`                                            | validate `lefthook.yml`                                                                  |
| `gitleaks git --redact .`                                                | scan the whole git history for secrets                                                   |

To be added later: `pnpm db:generate`, `pnpm db:migrate`, `pnpm db:seed`.
