# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Working in this repo

Per-machine instructions (how the owner and Claude split the work, how explanations are written, local paths and
the private content denylist) live in `CLAUDE.local.md`, which is git-ignored and loads right after this file.
Follow both; where they differ, `CLAUDE.local.md` wins.

- **Commits:** Conventional Commits (commitlint: header ≤ 72 characters, scopes = the packages + `tooling`, `ci`,
  `deps`). One coherent step or feature per commit; stage exact paths (`git add <paths>`, never `git add .`);
  empty placeholder files are committed with the step that fills them.
- **Branches and pull requests, from step 6c on** (owner decision, 2026-11-11): once Vercel is connected, a push to
  `main` is a production deploy. So every step gets its own branch (`feat/<step>`, `fix/<what>`); commits and pushes
  go there as often as needed (each push runs CI and builds a protected Vercel preview); a pull request into `main`
  is merged only after the preview looks right and CI is green, and the merge is what deploys to production.
  Enforced since step 6e by a GitHub ruleset on `main` (2026-11-12): no deletion, no force push, linear history,
  changes only through a pull request (0 approvals, the owner works alone; squash is the only merge method), and the
  required checks `Lint, typecheck, test, build` (CI) and `Vercel`, on a branch that is up to date with `main`. Repo
  settings: squash merging only, with the pull request title as the default message; head branches deleted after merge.
- **Every folder in `packages/` and `tooling/` has a `README.md`** (what it is, its public API or presets, the
  rules it holds); `apps/web` gets one once its sections exist, by step 6 at the latest. A change to a package's
  API, structure, presets or rules updates its README in the same commit.
- **Keep `CLAUDE.md` and `README.md` in sync with decisions.** Whenever an architecture, tooling, convention,
  security or accessibility decision is made or changed, update both in the same step: `CLAUDE.md` (rules and
  reasoning for future sessions) and `README.md` (what a reader or contributor needs). Significant decisions
  also get an ADR in `docs/adr/` (`NNNN-kebab-title.md`; Status, Date, Context, Decision, Alternatives considered,
  Consequences with + and −). ADRs are immutable: a changed decision gets a new ADR with
  `Supersedes: [NNNN…](…)`, and the old one only has its status changed to `Superseded by [NNNN…](…)`.
  Numbers are never reused.

## What this is

Personal portfolio for Mirel Nan (Senior Frontend Engineer), built from the CV, plus:
an "Ask about me" chat with Claude using tool use (must never invent experience), a job-match feature
with structured output, and an MCP server exposing the CV. Stages:
0 foundation + portfolio page → 1 Claude API → 2 tool use + structured output → 3 MCP → 4 Claude Code.
Domain: `mirelnan.dev`, live since 2026-11-11 (DNS at the registrar: `A @` and `CNAME www` from Vercel; `www` and
`http://` 308-redirect to `https://mirelnan.dev`; `.dev` is HTTPS-only via HSTS preload).
The "portfolio" project enters `cv-data` last, after the AI features of stages 1–2 (owner decision, 2026-11-12;
see "Personal projects").
The repository is public, but **all rights reserved** (`LICENSE`): code and content may be read, not reused. The
public `README.md` is written for engineers and hiring managers (what the site does, the live link, features with
their real status, architecture highlights); keep each status honest (✅ only when it is live).

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

- Apps never import `drizzle-orm`, `pg` or `@mirelnan/cv-data`; they use repository interfaces from `domain`,
  wired in `apps/web/src/server/container.ts` (composition root). Enforced by `no-restricted-imports` in
  `@mirelnan/eslint-config/next`.
- `apps/web` data flow (step 4e): `server/env.ts` validates `DATABASE_URL` with zod (the error names the
  variable, never its value); `server/container.ts` (`server-only`) opens one module-scoped pool with
  `connectToPostgres`, passes it to `attachDatabasePool` from `@vercel/functions` (releases idle clients before
  Fluid compute suspends; a no-op elsewhere) and exports `repositories`; `features/<feature>/queries.ts`
  (`server-only`) wraps each read in `"use cache"` + `cacheLife("max")`. Pages are therefore prerendered at build
  from the database (`○ /`, revalidate 30d): the CV changes only through a reseed, which ships with a deploy.
  `next build` needs `DATABASE_URL` (turbo.json declares it in `env` and hashes `.env*.local`), so CI needs a
  database for the build (decided at step 6). No `transpilePackages`: Turbopack compiles workspace packages.
- Packages expose only what is listed in `exports` in their `package.json` (no deep imports).
- Modules touching the DB or secrets import `server-only`.
- `apps/web/src`: `app/` is routing only; feature code lives in `features/<feature>/`;
  shadcn components in `components/ui/`; layout pieces in `components/layout/`.
- AI tools are shared by the chat and the MCP server — defined once in `@mirelnan/ai`.

## Conventions

- npm scope `@mirelnan/*`. Files and folders kebab-case; React components PascalCase; hooks `use-*.ts`; tests next to code as `*.test.ts`.
- DB: plural snake_case tables, snake_case columns, FK `<entity>_id`; camelCase in TS (Drizzle `casing: 'snake_case'`).
- DB schema (`packages/db/src/schema`, one file per aggregate): surrogate key `id` (integer identity) plus a unique
  `slug`; the domain only ever sees the slug, and the mappers translate. Months are `date` columns holding the first
  day. Postgres enums take their values from the domain (`pgEnum("ownership", ownershipSchema.enum)`). Aggregate
  rules are repeated as constraints (CHECK on periods and on a case study's subject, composite FK
  `(experience_id, phase_id)` so a phase belongs to the same experience, `UNIQUE NULLS NOT DISTINCT`).
  `onDelete: "cascade"` only inside an aggregate; references between aggregates block the delete. Constraint
  names are snake_case (name composite ones explicitly). No `created_at`/`updated_at`: data comes only from the
  seed and its history is in git. `packages/db/migrations` is generated, reviewed and committed, never edited by hand.
- AI tool names: verb_noun snake_case (`get_profile`, `search_cv`). API routes: kebab-case nouns (`/api/job-match`).
- TypeScript `strict` + `noUncheckedIndexedAccess`.
- Conventional Commits, enforced by commitlint in the `commit-msg` hook: header ≤ 72 chars; scope optional but
  one of `web`, `mcp-server`, `domain`, `cv-data`, `db`, `ai`, `tooling`, `ci`, `deps` (`commitlint.config.mjs`).
  A new package means a new scope. `docs:` for prose only, `chore(tooling):` for shared tool config,
  `build:` for dependencies and build orchestration.
- Migrations via `drizzle-kit generate` + `migrate` (never `push` against production). Seed is idempotent.
  **A new `NOT NULL` column on a table that has rows** (first case: `profiles.intro`, step 4f) is two generated
  migrations shipped together: add it with `.default("")` and generate, then drop the default and generate
  again; the seed then writes the real value. A single `ADD COLUMN … NOT NULL` fails on existing rows
  ("contains null values"). **Order on every deploy: `db:migrate` → `db:seed` → `next build`**, because the
  build prerenders from the database and reads the new columns.
- `Profile.intro` is the opening of `summary`, word for word (a `profileSchema` refinement): the hero shows it, so
  the first screen stays short without rewording the CV.
- **Seed** (`packages/db/src/seed/write-cv-data.ts`): `writeCvData(db, data)` parses with `cvDataSchema` first,
  then one transaction: `TRUNCATE … RESTART IDENTITY CASCADE` on every table, inserts in dependency order, slug →
  id maps that throw on an unknown slug (in Drizzle an `undefined` value means DEFAULT, so a silent miss would
  insert a wrong row). It takes the driver-independent `Database` type (`src/database.ts`), so tests run it on
  PGlite (in-memory Postgres, the real migrations) and step 3 on Neon. `cv-data` is the source of truth: the
  database is rebuilt from it, never edited.
- **Drizzle repositories** (`packages/db/src/repositories/drizzle-<entity>-repository.ts`): one factory per port,
  `createDrizzle<Entity>Repository(db): <Entity>Repository`, returning a plain object. Each query selects the
  domain's columns explicitly (no `getTableColumns`, so a new column never leaks into the domain) and turns a
  foreign key into its slug with `innerJoin` (`source_id` → `sourceSlug`). Order comes from `position`, or from
  `id` where a table has none (the seed inserts in `cv-data` order and resets identities). No zod on read: the
  trust boundary is the write. Tests are round trips on PGlite via `createTestDatabase()` (`src/test-database.ts`):
  seed `cvData`, then `toStrictEqual` against it.
  Aggregates load in a fixed number of queries (no N+1): roots first, then one query per list filtered with
  `inArray(<parent>_id, ids)` in `Promise.all`, grouped with `groupBy` and mapped by the pure functions in
  `to-domain.ts`; a nullable reference (`phase_id`, the case study's `about`) uses `leftJoin`. `list()` and
  `getBySlug()` share one loader with an optional `where`. The round-trip test adds fictitious records (a project
  and a case study about it) for aggregates `cv-data` does not have yet.
- **Neon access** (step 3): node-postgres (`pg`, `drizzle-orm/node-postgres`) over TCP for scripts and, at step 4,
  for the app (Neon's recommendation for Node.js and Vercel Fluid compute; the HTTP driver has no interactive
  transactions, which the seed needs). `src/client.ts` → `connectToPostgres(url)` returns `{ db, pool, close }`.
  Command-line scripts live in `src/cli/` (`no-console` off there only), run with `tsx --env-file-if-exists=.env.local`
  (in CI the variables come from the environment). Migrations run through `drizzle-orm`'s `migrate()` (same API
  as the PGlite tests), so `drizzle.config.ts` never holds credentials and drizzle-kit stays offline
  (`generate`, `check`).
- **Read-only role** (step 3b): `pnpm --filter @mirelnan/db db:reader` creates `portfolio_reader` with SQL (roles
  made in the Neon console join `neon_superuser`), or rotates its password when it exists; grants `CONNECT`,
  `USAGE` on `public`, `SELECT` on every table and `ALTER DEFAULT PRIVILEGES` for tables future migrations
  create (migrations run as the owner). It gets nothing on the `drizzle` schema. The password is 256 random bits
  in base64url, checked against `^[\w-]{32,}$` before it goes into the SQL text (`CREATE ROLE` takes no bind
  parameters). The script logs in as the reader and reads a table, then writes `DATABASE_URL` to
  `packages/db/.env.reader.local` (mode 600, git-ignored), never to the terminal. Grants are tested on PGlite with
  `has_table_privilege` and `SET ROLE`.
- **`@mirelnan/db` public API:** `exports: { ".": "./src/index.ts" }` + `sideEffects: false`; `index.ts` exports
  only `connectToPostgres(url)` (+ `PostgresConnection`), `createDrizzleRepositories(db): Repositories` and the
  `Database` type. Tables, ids and `writeCvData` stay internal.
- UI: light + dark + system themes via `next-themes`; colors only through CSS tokens (no hardcoded colors);
  no invented metrics, no skill progress bars. English only (`<html lang="en">`).

## Accessibility (first-class requirement)

Target **WCAG 2.2 AA**, in both themes. Every code review checks accessibility.

- Enforced by tooling: `eslint-plugin-jsx-a11y` (strict), `@axe-core/playwright` on every page in light and dark
  (violations fail CI), Lighthouse Accessibility = 100. E2E tests query by role/accessible name (`getByRole`).
- Semantic HTML first, ARIA only where HTML is not enough; one `h1`, no skipped heading levels.
- Full keyboard support, visible focus (`:focus-visible`), skip link, focus never hidden by the sticky header.
  How (step 4d): `globals.css` gives every element one focus style (`:focus-visible` → 2px solid `outline-ring`,
  offset 2px); the root layout renders `SkipLink` (first Tab stop, `href="#main"`), the sticky `SiteHeader` and
  `<main id="main">`; the header height is the `--header-height` token, reused as `scroll-padding-top` on
  `<html>`, so anchor jumps and focus scrolling stop below the header. Smooth scrolling only under
  `prefers-reduced-motion: no-preference`; the translucent header turns solid under `prefers-contrast: more`.
- Contrast ≥ 4.5:1 for text (≥ 3:1 for large text and UI parts); targets ≥ 24×24px; reflow at 320px / 400% zoom.
  Colour tokens live only in `apps/web/src/app/globals.css` (OKLCH, `:root` + `.dark`); `theme-contrast.test.ts`
  checks every text pair (4.5:1) and the focus ring and input border (3:1) in both themes, so a token change that
  breaks AA fails the tests. shadcn's defaults failed four of these (muted text on muted, light ring, both inputs).
- Respect `prefers-reduced-motion`, `prefers-contrast`, `forced-colors`. Never convey state by color alone.
- External links open in a new tab: the owner's profiles (LinkedIn, owner decision 2026-11-11) and the product links
  in the timeline (owner decision, 2026-11-13). Each has `target="_blank" rel="noopener noreferrer"`, a visible ↗
  (`aria-hidden`) and an `sr-only` "(opens in a new tab)", so the change of context is announced (WCAG G201).
  In-page and same-site links open in the same tab.
- **One accent: teal** (owner decision, 2026-11-10; light ≈ teal-700 `#0f766e`, dark ≈ teal-300 `#5eead4`). It marks
  information only (availability badge, "Owned", phase numbers, the selected skill together with a check mark),
  never decoration. It becomes its own tokens in `globals.css`, separate from shadcn's `--accent` (which is the
  neutral hover background), with its pairs added to `theme-contrast.test.ts`.
- **Highlights** (step 7a, 2026-11-12): the featured highlights as cards (`features/portfolio/highlights.ts` →
  `highlightCards`, a tested pure function; `components/highlights.tsx`), ordered by `featured.rank` (1–4, set in
  the data, independent of the bullets' CV order, which the timeline keeps); each card shows the phase's years
  when it has a phase, and "Owned" in teal only for owned highlights (contributed ones carry no label, decided by
  the owner). Section titles use `components/section-heading.tsx`. Grids use container queries (`@container`,
  `@2xl:grid-cols-2`).
- **Experience timeline** (owner decision 2026-11-10, built at step 7b): each experience shows its first 5
  highlights in CV order, the rest behind a native `<details>`/`<summary>` ("Show all N" / "Show fewer"), which
  announces its expanded state and needs no JavaScript, so the page stays static; the JWX phases are cards on the
  muted background, newest first and numbered in the order they happened, each with its period, industry, summary
  and product; every product note names the product's own industry, also inside a phase (it can differ from
  the phase's: JWX Portal). Badges show only the skills from the CV's "Technologies" line and the brief (`cardSkills`), not the
  skills matrix rows (36 at JWX). Roles that ended more than 10 years before the build month are grouped under an
  "Earlier experience" disclosure (`splitByAge`; the month comes from a `"use cache"` query, since the domain reads
  no clock). Each role is `#experience-<slug>`, the anchor the Highlights cards link to. Helpers are pure and tested
  (`features/portfolio/format.ts`, `timeline.ts`); product links open in a new tab (see the external-links rule).
- **Typography** (owner decision, 2026-11-10, as in the mockup): Geist Sans for text, Geist Mono for periods,
  durations, labels and section titles. `h1` fluid from 40px (phone) to 56px (desktop) with `clamp()`, headline
  20 → 24px; body 16px, line-height 1.6. Reading width ~760px, content container 1040px. **Four-step scale** below
  the hero titles (owner decision, 2026-11-13, replacing the mockup's 13/15/17/18px): 12px (`text-xs`, mono labels,
  badges, periods, section titles uppercase and tracked), 14px (`text-sm`, secondary lines: employment line, product
  note, "Show all"), 16px (`text-base`, everything meant to be read: intro, highlights, phase summaries) and 20px
  (`text-xl`, card titles). Hierarchy comes from weight and colour, not 1px steps; no arbitrary `text-[…]` sizes.
  `<summary>` toggles get `py-0.5` (24px target) and 44px under `pointer-coarse`, through padding: a `display: flex`
  summary loses its disclosure marker.
- **No copy without a source** (owner decision, 2026-11-10): every visible sentence about the owner comes from the
  data. "How I work" is three steps (Specify → Implement → Own the result) worded from the spec-driven highlight;
  the footer holds only email, LinkedIn and the accessibility statement link.
- **AI in the UI** (owner decision, 2026-11-10): the chat opens from an "Ask about me" button in the header (text
  plus the `⌘K` shortcut) and from the hero, as a 460px side sheet on desktop and full screen on phones. It speaks
  in the third person, by name ("Mirel worked…"), never as the owner, and every answer ends with source chips that
  link to the experience or phase in the timeline. Job match is its own route, `/job-match` (linked from the header
  and the hero as "Match me to your role"), so the home page stays static; requirement → linked evidence → level,
  where the level is shown as text and dots (Strong / Partial / Gap), never by colour alone. Until stage 1 the
  entry points are in the layout but marked "coming soon".
- Use Base UI primitives (via shadcn/ui, base `base`, style `base-nova`) for dialogs, menus, tabs — don't hand-roll
  them. shadcn copies component source into `components/ui/`: we own it and fix its accessibility gaps there.
  Fixes applied after every `shadcn add` (step 4c): focus is a solid `outline-ring` outline on `:focus-visible`
  (not `ring-ring/50`, which halves the contrast, and not a box-shadow ring, which forced-colors mode removes);
  menu items get the same outline, because their `bg-accent` highlight is only 1.07:1 against the popover;
  interactive parts get `pointer-coarse:min-h-11` (44px on touch). Components import `cn` from the `cn`
  package directly, so there is no `src/lib/utils.ts`. The outline variant uses `border-input` (3:1 against the
  background), not `border-border`. A link styled as a button uses `className={cn(buttonVariants(...))}`:
  `cva` only concatenates, so the base `border-transparent` and the variant's `border-input` both stay and the
  stylesheet order picks the winner (the border disappears); `cn` resolves the conflict in favour of the variant.
- Theme: `next-themes` (`attribute="class"`, `defaultTheme="system"`, `disableTransitionOnChange`) in the root
  layout, `suppressHydrationWarning` on `<html>` only. Its inline script sets the class before paint (no flash)
  and needs a CSP hash or nonce at the security-headers step. The toggle is a menu of radio items
  (Light / Dark / System, `closeOnClick` so focus returns to the trigger); the trigger icon switches through
  `dark:` CSS, never through `theme`, so server and client render the same markup.
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

## SEO (first-class requirement)

Aligned with modern SEO: technical quality, people-first content, structured data and AI search (GEO).
Decided by the owner on 2026-11-07; ADR `0007-seo-baseline.md` is written at step 4.

- **Structure: one page now.** Pages per case study (`/case-studies/[slug]`, static, with their own metadata, OG
  image and JSON-LD) are added only when a case study has substantial content; the first candidate is
  `this-portfolio`. Section and item anchors come from slugs (`#experience-jwp-connatix`,
  `#case-study-upgrade-sequencing`), so links keep working when pages are added.
- **Rendering:** all content is in the server-rendered HTML (Server Components + ISR), never client-only.
  Core Web Vitals targets as in UX: LCP < 2.5s, INP < 200ms, CLS < 0.1.
- **One canonical origin, `https://mirelnan.dev`:** `metadataBase` + `alternates.canonical`; `www` redirects to
  the apex; Vercel preview deployments are not indexed (`X-Robots-Tag: noindex`, checked by a test at step 6).
- **Metadata (Next.js Metadata API), generated from the data:** a unique `<title>` (≤ 60 characters) and meta
  description (≤ 160), Open Graph and Twitter cards with an image from `next/og`, `<html lang="en">`.
- **Crawling:** `app/robots.ts` allows every crawler, including AI search and training crawlers (GPTBot,
  OAI-SearchBot, ClaudeBot, PerplexityBot, Google-Extended); `app/sitemap.ts` lists the URLs from the data; an
  unknown URL returns a real 404.
- **Structured data:** JSON-LD `ProfilePage` with `mainEntity: Person` (name, job title, location, `sameAs`
  LinkedIn, `knowsAbout` from the top skills and `profile.competencies`, `alumniOf`), built from the repositories. `<` is escaped in the JSON
  (XSS), and the inline script gets a CSP hash or nonce (decided with the CSP at step 4).
- **Content:** facts only from the data (E-E-A-T comes from sourced, specific claims); one `h1`, descriptive
  headings and link text, meaningful `alt` (the same rules as accessibility).
- **AI search:** `/llms.txt` generated from the same repositories (a static route handler), so it cannot drift
  from the site; content written as self-contained, quotable statements.
- **Verified by:** Lighthouse SEO = 100 (desktop and mobile presets); a Playwright test for title, description,
  canonical, robots, and a JSON-LD that parses and contains the `Person`; `robots.txt`, `sitemap.xml` and
  `llms.txt` return 200. Google Search Console (a Domain property, verified by a DNS TXT record at the registrar, no
  script; the record must stay) and Bing Webmaster Tools (imported from Search Console), with the sitemap submitted:
  done at step 6d (2026-11-11).
- **Implemented at step 4j:** `features/portfolio/metadata.ts` (`portfolioMetadata(profile)`, a tested pure function:
  title "<name> · <role> · Portfolio", description = the intro's first sentence; it throws, failing the build,
  above 60 / 160 characters instead of letting search engines cut them), the root layout's `generateMetadata`
  (`metadataBase` as a string, because cached values must be serialisable, and the title template
  `%s · <name>`), `app/robots.ts`, `app/sitemap.ts` and `app/not-found.tsx` (our own 404: Next's default one adds a
  second `<title>`). The canonical origin lives in `lib/site.ts`. Still to come: JSON-LD, the OG image, `llms.txt`,
  the Playwright test, ADR 0007.
- **Indexing only on production:** `lib/deployment.ts` → `isProductionDeployment()` = `VERCEL_ENV === "production"`,
  read at build. Anything else (previews, local builds) gets `robots.txt` → `Disallow: /` and `X-Robots-Tag: noindex`.
  `VERCEL_ENV` is declared in turbo.json `build.env` (strict env mode would drop it, and it splits the cache).
- No tracking or analytics script for SEO (privacy rule). Search impact is measured in Search Console.

## Security (first-class requirement)

Baseline: OWASP Top 10 + OWASP Top 10 for LLM Applications. Every code review checks security.

- **HTTP headers** (set in `next.config.ts` / `proxy.ts`): CSP (`default-src 'self'`, `frame-ancestors 'none'`,
  `object-src 'none'`, `base-uri 'self'`), HSTS, `X-Content-Type-Options: nosniff`,
  `Referrer-Policy: strict-origin-when-cross-origin`, restrictive `Permissions-Policy`. Since step 4j they come from
  `apps/web/src/lib/security-headers.ts` (`securityHeaders({ production })`, tested), applied to `/:path*` in
  `next.config.ts`, with `poweredByHeader: false`; the CSP so far has only `frame-ancestors 'none'`, `base-uri`,
  `form-action` and `object-src` (plus `X-Frame-Options: DENY`), and gains `script-src` with the next-themes hash later. Nonce vs hash CSP is decided at step 4
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
  allowed only via `allowBuilds`; GitHub Actions pinned to commit SHA with minimal `permissions:`. Since step 6e:
  `minimumReleaseAge: 10080` (7 days) in `pnpm-workspace.yaml`, which pnpm 12 also enforces on the lockfile (a
  `--frozen-lockfile` install fails on a too-young entry), with `minimumReleaseAgeExclude` only for the daily
  browser-data packages (`caniuse-lite`, `electron-to-chromium`) and, temporarily, exact versions with a dated
  comment saying when to remove them. `.github/dependabot.yml`: weekly npm and github-actions updates with a 7-day
  `cooldown` (the same rule), minor and patch grouped in one pull request, Conventional titles (`build(deps): …`,
  `ci: …`); security updates are not delayed. In the repository settings: Dependabot alerts and security updates,
  secret scanning with push protection, CodeQL default setup (free because the repository is public).
- **Repo / platform**: protected `main` (PR + green CI), CodeQL, Vercel Deployment Protection on previews,
  `SECURITY.md` + `/.well-known/security.txt`. Since step 6e: `SECURITY.md` (scope, private reporting through GitHub
  private vulnerability reporting or email, a 7-day answer, good-faith limits) and
  `apps/web/public/.well-known/security.txt` (RFC 9116, served as a static file), whose `Expires` is checked by
  `apps/web/src/lib/security-txt.test.ts`: it fails 30 days before the date, so CI asks for the yearly renewal.
- **Runbook:** `docs/runbook.md` (deploying, changing the database, rotating the reader, rolling back,
  dependencies, the yearly tasks). Update it in the same change whenever one of those procedures changes.
- **Privacy**: no tracking cookies, so no consent banner; no third-party scripts without a reason. Analytics =
  Vercel Web Analytics (cookieless, served first-party from `/_vercel/insights`, so the CSP stays `'self'`),
  added at step 6d (`<Analytics />` from `@vercel/analytics/next` in the root layout, enabled in the Vercel
  dashboard; it sends nothing outside Vercel deployments); Google Analytics is ruled out (cookies → consent banner, a third-party
  script that costs INP/LCP, partial data).

## Content rules

### Approved sources

Claims about the owner come **only** from registered sources (ADR 0006). Each source is a record in
`cv-data` (`{ slug, kind, title }`); every claim points to one with `sourceSlug`. The kinds are fixed in `domain`:

| Kind               | Document                                                                                                                                                   | Rules                                    |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| `cv`               | the owner's CV                                                                                                                                             | used as written                          |
| `employment-brief` | owner's notes on client work, today `jwx-brief` (the JWX work and its phases, the four case studies, owned vs contributed, context notes, the AI workflow) | exclusions + confidentiality rules below |
| `project-brief`    | owner's notes on a personal project they fully own                                                                                                         | only released, public facts              |
| `skills-matrix`    | owner's list of the technologies used in each role (ADR 0008), the full version of the CV's "Technologies" lines                                           | names as in the CV                       |

Documents are transcription material only: the app and the AI never read them, and their location is never
stored in the data. Adding a source is approving it, so it goes through review. Never add a claim without a
`sourceSlug` that points to a registered source.

**Skills** (ADR 0008):

- The skill list is the CV's "Technical skills": the CV's names and groups, in the owner's ranking (`position` =
  importance; the page orders categories by their best skill, then skills by position). No versions in names
  ("Angular", not "Angular 12+"); AngularJS is a separate skill. Broad terms ("Web Development") are not skills:
  they are `profile.competencies`, used only for SEO (`knowsAbout`).
- Every skill is linked to at least one experience (a content test). A link's source is `cv` when the role's
  "Technologies" line names it (that line is also the card order), the JWX brief when the brief states it (with
  its context note), otherwise `skills-matrix`. JWX links carry the phase where the skill was used in only one.
- Years per skill come from these links: the union of the periods (the phase's when there is one), so overlaps
  count once. Never state years that the links don't give.
- Slugs can still change until the site is released; after that they are stable (`?skill=` links).
- **`packages/cv-data/README.md`** is the how-to for new content (a skill, an experience, a product) and the
  list of checks that catch mistakes. Update it in the same change whenever that workflow changes: a new
  collection or source, a new generator, a new content test or schema rule, a changed deploy order.
- **Generated, never edited by hand:** `src/skills.ts` and each experience's `skills` block come from
  `packages/cv-data/scripts/generate-skills.ts` (`pnpm --filter @mirelnan/cv-data generate:skills`; runbook in
  `scripts/README.md`). It reads the CV PDF (`pdftotext`) and the CSV from `scripts/input/` (git-ignored, so the
  private inputs cannot be committed); the ranking, aliases, broad terms and slug overrides are in
  `scripts/skills-config.ts`. It computes every file before writing any, so a failed check changes nothing, then
  runs Prettier. A brief link keeps its source and note. `scripts/` has its own `tsconfig.json` (node preset,
  checked by `typecheck`) and an ESLint override that allows Node built-ins and `console` there only.

**Excluded topics.** The owner keeps a list of topics from the employment brief that never go into the data, the UI
or chat answers. The list is private (`CLAUDE.local.md`), because the terms themselves would reveal what they
exclude. It is enforced by the `private terms` pre-commit job, which greps staged `cv-data` files against the
git-ignored pattern file `.private-terms.local`; the public `cv-data` content tests check only what reveals nothing
(phone numbers, change counts).

### Personal projects

- A `Project` is in the data only once it is released (`releasedOn` is required); work in progress stays in the
  project's brief. Unreleased plans are treated like a client's unreleased roadmap. A `cv-data` content test
  rejects a `releasedOn` or `offlineSince` later than the current month (kept out of the `domain` schema, which
  stays pure and does not read the clock).
- Links are optional and public only (no private repositories). Once `offlineSince` is set, the website and
  store links are hidden everywhere (`visibleLinks`), because an expired domain can be bought by someone else.
- Personal projects are fully owned, so they have no `ownership` field.
- Case studies are optional, zero or more per experience or project; `about` says which.

### Product context

Product/industry descriptions (JWX Portal, JWX Dashboard, Res_Q, HPI Check) are public context with `source_url`,
never evidence of contributions; no vendor marketing numbers, no logos. A product is named as its public page names
it (`portal.connatix.com` is titled "JWX Portal"), never by an internal name. When no public page describes what a
product does, the description states only sourced facts (JWX Portal: the Connatix–JW Player merger press release).
The JWX phases themselves stay generic ("content management suite", "video platform dashboard").
Product descriptions are shown **on the site only** (product cards): AI tools never return them, so the chat,
job match and MCP server cannot use them (owner decision, 2026-11-05).

### Ownership

Highlights carry `ownership: "owned" | "contributed"`. Owned: metering & billing, both framework upgrades, the shared-library extraction, the CI/CD pipeline for the shared libraries and
the spec-driven delivery of the 2026 feature work (the last two because the CV says "owned"; owner decision,
2026-11-07). The AI media-transformation build-out is `contributed`: it was team work (owner decision, 2026-11-12,
replacing the brief's "owned"). Never present `contributed` as `owned`, never claim a whole product.

### JWX phases

Two phases, as in the brief (owner decision, 2026-11-07; the brief was updated to match on 2026-11-08):
`content-management-suite` (2023-03 – 2024-12, `video-content-management`; it includes the suite's advertising
side) and
`video-platform-dashboard` (2025-01 – 2026-10, `video-tech`, linked to the JWX Dashboard product); the first
phase is linked to the JWX Portal product. The phase
months come from the brief. A CV bullet the brief places in a phase gets
that `phaseSlug`; a CV bullet the brief does not place stays on the experience. The brief adds only work the CV
does not mention; its details on work the CV already lists go into the case studies.

### Confidentiality (applies to site, data, chat, job match, MCP)

- No internal ticket IDs, branch names or repository links.
- No internal product codenames, no feature-flag names.
- No unreleased roadmap, no business figures (revenue, customer counts, pricing).
- No architecture detail precise enough to reproduce — describe the shape of the problem, not the internals.
- Code from client work is **never** a content source (the local paths are in `CLAUDE.local.md`).
- The chat declines such requests with: "That's covered by a confidentiality agreement, so I can describe the
  shape of the problem instead."

### Always

- **Never include the phone number** anywhere (data, seed, UI, PDFs, fixtures). The `Profile` type has no `phone` field.
  The only CV PDF allowed in the repo is the no-phone export, as `apps/web/public/mirel-nan-cv.pdf`
  (its source file is named in `CLAUDE.local.md`);
  re-check any new export for phone traces (text, `tel:` links, metadata) before committing it.
- The chat, job match and MCP server answer **only** from registered sources (the CV, employment briefs, project
  briefs), through tool results over the database, with the exclusions and confidentiality rules above applied,
  and say "not in the CV" otherwise — never from the model's general knowledge or from product pages.

## Secrets

Only in `.env.local` (git-ignored) and Vercel project settings. Each consumer has its own `.env.example` next to
it, listing only the variables that process needs (least privilege: the web app never holds the owner URL):

| Where                              | Variable                                                                  | Role / use                                                                   |
| ---------------------------------- | ------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `packages/db/.env.local`           | `DATABASE_ADMIN_URL`                                                      | Neon owner role, direct (unpooled); only `db:migrate` and `db:seed`, locally |
| `apps/web/.env.local` + Vercel (4) | `DATABASE_URL`                                                            | read-only role `portfolio_reader` (step 3b), pooled                          |
| `apps/web` + Vercel (5, stage 1+)  | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `ANTHROPIC_API_KEY` | rate limit (Upstash created at step 5, when first used), Claude API          |

On Vercel, a secret is saved as a **Sensitive** environment variable (its value can no longer be read back, only
replaced), for Production and Preview only; a plain one makes Vercel flag it as "Needs attention". A variable
cannot be switched to Sensitive: delete it and add it again. Tick both Production and Preview: a pull request's preview build
runs with the Preview variables, and without `DATABASE_URL` it fails with the `env.ts` error (seen on the first PR
preview, 2026-11-11). Rotating the reader (`db:reader` again, owner decision
2026-11-11 after the first value had been stored as plain text): the old password stops working at once, so update
`apps/web/.env.local` (the script writes the direct host: add `-pooler`) and the Vercel variable, then redeploy. The
live static page keeps working meanwhile; only new builds need the new URL. Delete `packages/db/.env.reader.local`
once copied.

Connection strings use `sslmode=verify-full` (node-postgres treats `require` as an alias and warns). Errors about
a variable never echo its value. When the Neon integration is connected to the Vercel project (step 6), it must
not inject the owner `DATABASE_URL` into the app: set the reader URL by hand (or use a variable prefix).

## Tooling decisions

- Shared versions live in the pnpm **catalog** (`pnpm-workspace.yaml`); packages use `"catalog:"`.
  Internal packages use `workspace:*`. Tool-config packages declare the tool as a `peerDependency`.
- **Node 26** (Active LTS since 2026-10-28, end of life 2029-04-30; owner decision, 2026-11-11, replacing 24, which
  moved to maintenance). One source per tool: `.nvmrc` (`nvm use`, CI's `setup-node`), `engines.node` in the root
  `package.json` (`>=26`) and in `apps/web/package.json` (`26.x`, which Vercel reads from the Root Directory; its
  default would be another major), `@types/node` 26 from the catalog. Node 26 no longer ships Corepack:
  `npm install -g corepack && corepack enable pnpm` locally; CI installs pnpm with `pnpm/action-setup`. The TypeScript
  target stays ES2024 (browsers, not Node, set that floor).
- **TypeScript 6.0.x**, not 7: Next.js, typescript-eslint and drizzle-kit need the JS compiler API.
- **ESLint 10** (v9 is EOL since 2026-08-06). `eslint-config-next` 16.4 wraps `eslint-plugin-react` and
  `eslint-plugin-import` for ESLint 10 itself, and `jsx-a11y` works unwrapped, so no `@eslint/compat` (checked at
  step 4a with a deliberately bad component). Their peer ranges stop at ESLint 9: `peerDependencyRules.allowedVersions`
  in `pnpm-workspace.yaml` allows 10 for exactly those three plugins.
- **Next.js 16.4.x** (exact, `eslint-config-next` the same version, in `@mirelnan/eslint-config`), React 19.3.x
  exact, Tailwind 4.3.x exact with `@tailwindcss/turbopack` (Tailwind as a Turbopack loader, no PostCSS config).
  `next.config.ts`: `cacheComponents: true` (the Next 16 model: prerendered by default, `"use cache"` for cached
  data, instead of route-level ISR `revalidate`) with `partialPrefetching: true` (Next recommends both for new
  projects; both become the default in the next major), `agentRules: false` (no generated `AGENTS.md`). The docs for the
  installed version are in `apps/web/node_modules/next/dist/docs/`: read the relevant guide there before writing
  Next.js code, because APIs changed after the model's training data.
- `apps/web` `typecheck` is `next typegen && tsc`: typegen writes the route types (`LayoutProps<"/">`,
  `PageProps`) into `.next/types`, which `tsconfig.json` includes. `apps/web/turbo.json` (a Turbo package configuration,
  `extends: ["//"]`) makes the web `build` depend on `typecheck`: `next build` empties `.next/` when it starts, so run in
  parallel, `tsc` could find the route types deleted (TS6053, seen in CI on 2026-11-11).
- Before picking any version: check latest, **support/EOL status** and peer ranges; test in a scratch dir if unsure.
  A new dependency version must be at least 7 days old (the planned `minimumReleaseAge`), unless it is a
  security fix; pin it exact when the package is pre-1.0 or releases daily.
- Dependency install scripts are blocked by pnpm; decisions are recorded in `allowBuilds` in
  `pnpm-workspace.yaml` (`lefthook: false` — hooks are installed by our own root `prepare` script instead;
  `esbuild: false` — drizzle-kit needs it, and its platform binary arrives as an optional dependency).
- **Drizzle ORM 0.45.x + drizzle-kit 0.31.x**, exact versions in `packages/db` (1.0 is still a release candidate).
- Prettier runs once from the root (not via Turbo); ESLint and `tsc` run per package via Turbo.
  Tool-managed files (`pnpm-lock.yaml`, `pnpm-workspace.yaml`) are in `.prettierignore`.
- Git hooks (`lefthook.yml`): pre-commit = gitleaks on staged diff, then Prettier on staged files, then ESLint
  (`piped`); commit-msg = commitlint. ESLint is a `group` with one parallel job per package that has an
  `eslint.config.js` (`root: packages/<name>/`, `glob: "*.{ts,tsx,js,mjs,cjs}"`, `pnpm exec eslint {staged_files}`):
  the same command as `pnpm lint`, no `--fix` (only Prettier rewrites staged files). A new package or app adds
  its job when it gets its ESLint config (`apps/web` has one since step 4a).
  Hooks are a convenience, not a control — CI re-runs everything.
- **Vercel** (step 6c, set in the dashboard): Root Directory `apps/web` ("Include files outside the root directory"
  on), framework Next.js with the default commands; Vercel detects `turbo.json` and runs `turbo run build`, so
  `apps/web/turbo.json` applies there too (typecheck, then build). Node comes from `engines` (26.x). pnpm comes from
  `packageManager` through Corepack (`ENABLE_EXPERIMENTAL_COREPACK=1`; without it Vercel picks pnpm 9/10 from the
  lockfile version). `DATABASE_URL` = the reader's pooled URL, set by hand for Production and Preview; the Neon
  store is never connected to the project (it would inject the owner URL). Standard Deployment Protection (previews
  need a Vercel login, production is public). Function region `fra1`, next to Neon in Frankfurt, for the dynamic
  routes of stages 1–2 (the home page is static and reads Neon only at build). `ENABLE_EXPERIMENTAL_COREPACK` is in turbo.json
  `globalPassThroughEnv` (it reaches every task without changing the cache hash); the remaining Vercel warning that
  `typecheck` does not get `DATABASE_URL` is intended (it does not need it).
- **CI** (`.github/workflows/ci.yml`, step 6a): one job on `ubuntu-24.04` with a throwaway Postgres 18 service (image
  pinned by digest, `trust` auth, no secrets: it only ever holds the seeded public data), because `next build`
  prerenders from a database. Steps: `pnpm install --frozen-lockfile --ignore-scripts` → `pnpm audit --audit-level=high`
  → `format:check` → `db:check` → `db:migrate` → `db:seed` → `turbo run lint typecheck test build`. Actions are pinned
  to a commit SHA (release in a comment, ≥ 7 days old), `permissions: contents: read`, `persist-credentials: false`,
  `concurrency` cancels superseded runs. CI never touches Neon.
- `packages/db/vitest.config.ts` raises `hookTimeout` (60s) and `testTimeout` (30s): booting PGlite takes ~3s on two
  free cores and over Vitest's 10s default on a CI runner busy with the other packages' tasks.
- gitleaks is a system binary (`~/.local/bin`, installed from the official release with checksum check), not an npm package.
- **Package template** (set by `packages/domain`): `exports` points at TS source (`./src/index.ts`, no build),
  `sideEffects: false`, scripts `lint: eslint .`, `typecheck: tsc`, `test: vitest run`; `tsconfig.json` extends a
  preset with `include: ["src", "vitest.config.ts"]`; `vitest.config.ts` sets `test.name` to the package's short name
  (it labels the output and the GitHub Actions job summary, "(db) Vitest Test Report"); `eslint.config.js` extends a preset and sets `tsconfigRootDir: import.meta.dirname`
  (needed when ESLint runs over several packages at once). `index.ts` lists public exports by name (no `export *`).
- **Vitest 5** for unit tests: explicit `import { describe, it, expect } from "vitest"` (no globals, so library
  packages need no extra `types`), tests next to the code, table-driven with `it.each`; test through the public API.
  Turbo `test` has no outputs until coverage is enabled in CI.
- `--save-catalog` only for external packages; never in the same `pnpm add` as `workspace:*` packages.
- **Domain schemas** (zod 4): every object is `z.strictObject`; types come from `z.infer`. References between
  entities are `<entity>Slug` (`industrySlug`, `phaseSlug`, mirroring `<entity>_id` in the DB); identity in the
  domain is the slug, never a DB id. Provenance is `sourceSlug` (a registered source), never an enum of documents. Periods are a `Period` value object `{ start, end }` (`end: null` = ongoing).
  Cross-field rules (`refine`/`superRefine`) pass `when: (payload) => payload.issues.length === 0`, because zod
  still runs them after a field failed. Aggregate invariants live in the aggregate's schema; cross-aggregate
  references (a case study's experience exists) are checked by the `cv-data` tests and DB foreign keys.
- **`CvData`** is `z.infer<typeof cvDataSchema>` (`domain/entities/cv-data.ts`): the whole snapshot, validated by
  the `cv-data` tests and again by the seed before it writes. `cv-data` holds one file per collection (one per
  experience) and `cv.ts` assembles them. Data files end in `satisfies X[]` (checked, inferred type kept);
  `cv.ts` annotates `cvData: CvData` (the exported contract; an empty list is `Project[]`, not `never[]`). Its tests check schemas, unique slugs, every `*Slug` reference, no
  phone-like number, the excluded brief topics, no future release dates, every skill linked to an experience and
  no competency that is also a skill.
- **Repositories (ports)**: one read-only interface per aggregate root (10, including `sources` and `projects`) in `domain/src/repositories/`, bundled in
  `Repositories`. Methods return promises; a missing item is `null`, not an exception. Only methods a known
  consumer needs (no generic CRUD; the seed writes through `db` directly). Consumers take only the ports they
  need (`Pick<Repositories, …>`); the AI layer never gets `products`. The in-memory adapter is a separate entry
  point, `@mirelnan/domain/testing`, so test helpers stay out of the main API.

## Commands

| Command                                                                  | What it does                                                                             |
| ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| `pnpm install`                                                           | install; on a fresh clone also runs `prepare` → `lefthook install`                       |
| `pnpm run prepare`                                                       | (re)install git hooks — pnpm 12 skips `prepare` when the install is "Already up to date" |
| `pnpm format` / `pnpm format:check`                                      | Prettier write / check over the whole repo (CI uses `check`)                             |
| `pnpm lint` / `pnpm typecheck` / `pnpm test` / `pnpm build` / `pnpm dev` | Turbo tasks across packages                                                              |
| `pnpm exec lefthook validate`                                            | validate `lefthook.yml`                                                                  |
| `gitleaks git --redact .`                                                | scan the whole git history for secrets                                                   |

Database: `pnpm --filter @mirelnan/db db:generate --name <name>`, `db:check`, `db:migrate`, `db:seed`, `db:reader` (see `packages/db/README.md`).
