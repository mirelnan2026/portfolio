# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Working in this repo

Per-machine instructions (how the owner and Claude split the work, how explanations are written, local paths and
the private content denylist) live in `CLAUDE.local.md`, which is git-ignored and loads right after this file.
Follow both; where they differ, `CLAUDE.local.md` wins.

- **Commits:** Conventional Commits (commitlint: header ≤ 72 characters, scopes = the packages + `tooling`, `ci`,
  `deps`). One coherent step or feature per commit; stage exact paths (`git add <paths>`, never `git add .`);
  empty placeholder files are committed with the step that fills them.
- **Branches and pull requests:** a push to `main` is a production deploy, so every step gets its own branch
  (`feat/<step>`, `fix/<what>`); commits and pushes go there as often as needed (each push runs CI and builds a
  protected Vercel preview); a pull request into `main` is merged only after the preview looks right and CI is green,
  and the merge deploys. A GitHub ruleset on `main` enforces it: no deletion, no force push, linear history, changes
  only through a pull request (0 approvals, squash only), required checks `Lint, typecheck, test, build` (CI) and
  `Vercel`, branch up to date with `main`. Repo settings: squash merging only with the pull request title as the
  message; head branches deleted after merge.
- **Every folder in `packages/` and `tooling/` has a `README.md`** (what it is, its public API or presets, the
  rules it holds); `apps/web/README.md` (structure, data flow, environment, design rules, scripts) follows the same
  rule. A change to a package's API, structure, presets or rules updates its README in the same commit.
- **Keep `CLAUDE.md` and `README.md` in sync with decisions.** Whenever an architecture, tooling, convention,
  security or accessibility decision is made or changed, update both in the same step: `CLAUDE.md` (rules for
  future sessions) and `README.md` (what a reader or contributor needs). Significant decisions also get an ADR in
  `docs/adr/` (`NNNN-kebab-title.md`; Status, Date, Context, Decision, Alternatives considered, Consequences with +
  and −). ADRs are immutable: a changed decision gets a new ADR with `Supersedes: [NNNN…](…)`, and the old one only
  has its status changed to `Superseded by [NNNN…](…)`. Numbers are never reused. `CLAUDE.md` holds the rules and
  points to the ADR for the reasoning; do not repeat an ADR here.

## What this is

Personal portfolio for Mirel Nan (Senior Frontend Engineer), built from the CV, plus an "Ask about me" chat with
Claude using tool use (must never invent experience), a job-match feature with structured output, and an MCP server
exposing the CV. Stages: 0 foundation + portfolio page → 1 Claude API → 2 tool use + structured output → 3 MCP →
4 Claude Code. The site itself is a personal project in `cv-data` (`portfolio`, source `portfolio-brief`).
Domain `mirelnan.dev` (DNS at the registrar: `A @` and `CNAME www` from Vercel; `www` and `http://` 308-redirect to
`https://mirelnan.dev`; `.dev` is HTTPS-only via HSTS preload).
The repository is public, but **all rights reserved** (`LICENSE`): code and content may be read, not reused. The
public `README.md` is written for engineers and hiring managers (what the site does, the live link, features with
their real status, architecture highlights); keep each status honest (✅ only when it is live).

## Architecture

**Modular monolith** with a single style: layers with ports and adapters ([ADR 0001](docs/adr/0001-monorepo-layout.md),
[0002](docs/adr/0002-layered-architecture.md)). One repo, one data model, one database, shipped as two apps. `domain`
holds the model and the ports (repository interfaces); `db` is the outbound adapter; `ai` holds the use cases (Claude
tools); `apps/*` are inbound adapters (HTTP, MCP) plus the composition root. Inside each package the folder layout
fits its role (domain by role, db by tool, ai by capability, web by feature); the package template and the dependency
rule are the same everywhere. Not microservices: split a part out only if it needs its own scaling, deploy cadence
or data.

pnpm workspaces + Turborepo. `apps/` = deployables, `packages/` = libraries, `tooling/` = shared config.

```
apps/web           @mirelnan/web         Next.js App Router, React, TS, Tailwind v4, shadcn/ui (Vercel)
apps/mcp-server    @mirelnan/mcp-server  MCP server (stdio), stage 3
packages/domain    @mirelnan/domain      entities + zod schemas, repository interfaces, pure rules. No I/O.
packages/cv-data   @mirelnan/cv-data     cv.ts — single source of truth for CV content (used by seed only)
packages/db        @mirelnan/db          Drizzle schema, Postgres client, migrations, seed, repository implementations
packages/ai        @mirelnan/ai          tool definitions, prompts, job-match (stage 1+)
tooling/*          @mirelnan/tsconfig, @mirelnan/eslint-config, @mirelnan/prettier-config
docs/adr           Architecture Decision Records
```

Dependency direction (one way only): `domain` ← `cv-data`, `db`, `ai` ← `apps/*`.

- Apps never import `drizzle-orm`, `pg` or `@mirelnan/cv-data`; they use repository interfaces from `domain`, wired in
  `apps/web/src/server/container.ts` (composition root). Enforced by `no-restricted-imports` in
  `@mirelnan/eslint-config/next`.
- `apps/web` data flow: `server/env.ts` validates `DATABASE_URL` with zod (the error names the variable, never its
  value); `server/container.ts` (`server-only`) opens one module-scoped pool with `connectToPostgres`, passes it to
  `attachDatabasePool` from `@vercel/functions` (releases idle clients before Fluid compute suspends; a no-op
  elsewhere) and exports `repositories`; `features/<feature>/queries.ts` (`server-only`) wraps each read in
  `"use cache"` + `cacheLife("max")`. Pages are prerendered at build from the database: the CV changes only through a
  reseed, which ships with a deploy. `next build` needs `DATABASE_URL` (turbo.json declares it in `env` and hashes
  `.env*.local`), so CI needs a database for the build. No `transpilePackages`: Turbopack compiles workspace packages.
- Packages expose only what is listed in `exports` in their `package.json` (no deep imports).
- Modules touching the DB or secrets import `server-only`.
- `apps/web/src`: `app/` is routing only; feature code lives in `features/<feature>/`; shadcn components in
  `components/ui/`; layout pieces in `components/layout/` (layout components never import from `features/`; they get
  plain props).
- AI tools are shared by the chat and the MCP server: defined once in `@mirelnan/ai`.

## Conventions

- npm scope `@mirelnan/*`. Files and folders kebab-case; React components PascalCase; hooks `use-*.ts`; tests next to
  code as `*.test.ts`.
- DB: plural snake_case tables, snake_case columns, FK `<entity>_id`; camelCase in TS (Drizzle `casing: 'snake_case'`).
- DB schema (`packages/db/src/schema`, one file per aggregate): surrogate key `id` (integer identity) plus a unique
  `slug`; the domain only ever sees the slug, and the mappers translate. Months are `date` columns holding the first
  day. Postgres enums take their values from the domain (`pgEnum("ownership", ownershipSchema.enum)`). Aggregate
  rules are repeated as constraints (CHECK on periods and on a case study's subject, composite FK
  `(experience_id, phase_id)` so a phase belongs to the same experience, `UNIQUE NULLS NOT DISTINCT`).
  `onDelete: "cascade"` only inside an aggregate; references between aggregates block the delete. Constraint names are
  snake_case (name composite ones explicitly). No `created_at`/`updated_at`: data comes only from the seed and its
  history is in git. `packages/db/migrations` is generated, reviewed and committed, never edited by hand.
- AI tool names: verb_noun snake_case (`get_profile`, `search_cv`). API routes: kebab-case nouns (`/api/job-match`).
- TypeScript `strict` + `noUncheckedIndexedAccess`.
- Conventional Commits, enforced by commitlint in the `commit-msg` hook: scope optional but one of `web`,
  `mcp-server`, `domain`, `cv-data`, `db`, `ai`, `tooling`, `ci`, `deps` (`commitlint.config.mjs`). A new package
  means a new scope. `docs:` for prose only, `chore(tooling):` for shared tool config, `build:` for dependencies and
  build orchestration.
- Migrations via `drizzle-kit generate` + `migrate` (never `push` against production). Seed is idempotent.
  **A new `NOT NULL` column on a table that has rows** is two generated migrations shipped together: add it with
  `.default("")` and generate, then drop the default and generate again; the seed then writes the real value. A single
  `ADD COLUMN … NOT NULL` fails on existing rows. **Order on every deploy: `db:migrate` → `db:seed` → `next build`**,
  because the build prerenders from the database and reads the new columns.
- `Profile.intro` is the opening of `summary`, word for word (a `profileSchema` refinement): the hero shows it.
- **Seed** (`packages/db/src/seed/write-cv-data.ts`): `writeCvData(db, data)` parses with `cvDataSchema` first, then one
  transaction: `TRUNCATE … RESTART IDENTITY CASCADE` on every table, inserts in dependency order, slug → id maps that
  throw on an unknown slug (in Drizzle an `undefined` value means DEFAULT, so a silent miss would insert a wrong row).
  It takes the driver-independent `Database` type, so tests run it on PGlite (in-memory Postgres, the real migrations)
  and the CLI on Neon. `cv-data` is the source of truth: the database is rebuilt from it, never edited.
- **Drizzle repositories** (`packages/db/src/repositories/drizzle-<entity>-repository.ts`): one factory per port,
  `createDrizzle<Entity>Repository(db)`, returning a plain object. Each query selects the domain's columns explicitly
  (no `getTableColumns`, so a new column never leaks into the domain) and turns a foreign key into its slug with
  `innerJoin`. Order from `position`, or `id` where a table has none. No zod on read: the trust boundary is the write.
  Aggregates load in a fixed number of queries (no N+1): roots first, then one query per list filtered with
  `inArray(<parent>_id, ids)` in `Promise.all`, mapped by the pure functions in `to-domain.ts`; a nullable reference
  uses `leftJoin`; `list()` and `getBySlug()` share one loader. Tests are round trips on PGlite via
  `createTestDatabase()`: seed `cvData`, then `toStrictEqual` against it (fictitious records cover aggregates `cv-data`
  does not have yet).
- **Postgres access** ([ADR 0003](docs/adr/0003-orm-drizzle.md), amended: node-postgres, not the Neon serverless
  driver): `pg` + `drizzle-orm/node-postgres` over TCP for scripts and the app (Neon's recommendation for Node.js and
  Vercel Fluid compute; the HTTP driver has no interactive transactions, which the seed needs). `src/client.ts` →
  `connectToPostgres(url)` returns `{ db, pool, close }`. Command-line scripts live in `src/cli/` (`no-console` off
  there only), run with `tsx --env-file-if-exists=.env.local` (in CI the variables come from the environment).
  Migrations run through `drizzle-orm`'s `migrate()` (same API as the PGlite tests), so `drizzle.config.ts` never holds
  credentials and drizzle-kit stays offline (`generate`, `check`).
- **Read-only role:** `pnpm --filter @mirelnan/db db:reader` creates `portfolio_reader` with SQL (roles made in the Neon
  console join `neon_superuser`) or rotates its password; `CONNECT`, `USAGE` on `public`, `SELECT` on every table and
  default privileges for future tables; nothing on the `drizzle` schema. The password is 256 random bits in base64url,
  checked against `^[\w-]{32,}$` before it goes into the SQL text (`CREATE ROLE` takes no bind parameters). The script
  verifies by logging in as the reader and writes `DATABASE_URL` to `packages/db/.env.reader.local` (mode 600,
  git-ignored), never to the terminal. Grants are tested on PGlite.
- **`@mirelnan/db` public API:** `exports: { ".": "./src/index.ts" }` + `sideEffects: false`; `index.ts` exports only
  `connectToPostgres(url)` (+ `PostgresConnection`), `createDrizzleRepositories(db): Repositories` and the `Database`
  type. Tables, ids and `writeCvData` stay internal.
- UI: light + dark + system themes via `next-themes`; colours only through CSS tokens (no hardcoded colours); no
  invented metrics, no skill progress bars. English only (`<html lang="en">`).

## Accessibility (first-class requirement)

Target **WCAG 2.2 AA**, in both themes ([ADR 0004](docs/adr/0004-accessibility-wcag-2-2-aa.md)). Every code review
checks accessibility.

- **Enforced by tooling:** `eslint-plugin-jsx-a11y` (strict); `theme-contrast.test.ts` (every text pair 4.5:1, the
  focus ring and input border 3:1, both themes: a token change that breaks AA fails the tests); `@axe-core/playwright`
  in CI; Lighthouse Accessibility = 100 (Lighthouse CI is not set up). E2E tests query by role/accessible name
  (`getByRole`).
- **E2E setup:** `apps/web/playwright.config.ts` runs `apps/web/e2e/` against the production build (`next start` on
  port 3100) as two projects, Desktop Chrome and Pixel 7. `accessibility.spec.ts` runs axe with the WCAG
  2.0/2.1/2.2 A and AA tags on `/`, `/?skill=php` (hidden content opened), `/accessibility` and a 404, in light and
  dark, and lists any violation by rule and element. `page.spec.ts` covers the h1, the section navigation (the sheet on
  phones), `?skill=`, the security headers, the SEO tags and JSON-LD, `robots.txt`/`sitemap.xml`/`llms.txt` and the 404. CI installs Chromium (`playwright install --with-deps chromium`) and runs the web `test:e2e` script after the
  build; Vitest excludes `e2e/**`. Versions pinned exact (`@playwright/test`,
  `@axe-core/playwright`). The public statement is `app/accessibility/page.tsx` (footer link, sitemap); it claims only
  the checks that run (no screen-reader testing is claimed).
- **Every new page or feature ships with its e2e accessibility coverage**, in the same pull request: a new route goes
  into the `pages` list of `e2e/accessibility.spec.ts` (axe in light and dark, desktop and phone); a new interactive
  state that reveals or changes content (a dialog or sheet open, a panel expanded, a selection, an error message, a
  streamed chat answer) gets an axe run in that state, plus a `page.spec.ts` test that drives it with `getByRole`
  (keyboard included when it matters). The accessibility statement is updated if the checks change.
- Semantic HTML first, ARIA only where HTML is not enough; one `h1`, no skipped heading levels.
- Full keyboard support, visible focus, skip link, focus never hidden by the sticky header. `globals.css` gives every
  element one focus style (`:focus-visible` → 2px solid `outline-ring`, offset 2px); the root layout renders `SkipLink`
  (first Tab stop, `href="#main"`), the sticky `SiteHeader` and `<main id="main">`; the header height is the
  `--header-height` token, reused as `scroll-padding-top` on `<html>`. Smooth scrolling only under
  `prefers-reduced-motion: no-preference`; the translucent header turns solid under `prefers-contrast: more`.
- Contrast ≥ 4.5:1 for text (≥ 3:1 for large text and UI parts); targets ≥ 24×24px; reflow at 320px / 400% zoom.
  Colour tokens live only in `apps/web/src/app/globals.css` (OKLCH, `:root` + `.dark`). shadcn's defaults failed four
  pairs (muted text on muted, light ring, both inputs), so those tokens are corrected there.
- Respect `prefers-reduced-motion`, `prefers-contrast`, `forced-colors`. Never convey state by colour alone.
- External links (the owner's profiles such as LinkedIn, and the product links in the timeline) open in a new tab with
  `target="_blank" rel="noopener noreferrer"`, a visible ↗ (`aria-hidden`) and an `sr-only` "(opens in a new tab)"
  (WCAG G201). In-page and same-site links open in the same tab.
- **One accent: teal** (light ≈ teal-700 `#0f766e`, dark ≈ teal-300 `#5eead4`). It marks information only
  (availability badge, "Owned", phase numbers, the selected skill together with a check mark), never decoration. Its
  own tokens (`brand`, `brand-soft`) in `globals.css`, separate from shadcn's `--accent` (the neutral hover
  background), with their pairs in `theme-contrast.test.ts`.
- **Highlights:** featured highlights as cards (`features/portfolio/highlights.ts` → `highlightCards`, a tested pure
  function; `components/highlights.tsx`), ordered by `featured.rank` (1–4, set in the data, independent of the bullets'
  CV order, which the timeline keeps); each card shows the phase's years when it has a phase, and "Owned" in teal only
  for owned highlights (contributed ones carry no label). Section titles use `components/section-heading.tsx`. Grids
  use container queries (`@container`, `@2xl:grid-cols-2`).
- **Experience timeline:** each experience shows its first 5 highlights in CV order, the rest behind a native
  `<details>`/`<summary>` ("Show all N" / "Show fewer": no JavaScript); the JWX phases are muted cards, newest first and
  numbered in the order they happened (period, industry, summary, product); a product is one line, "Product ·
  <industry> · <name> ↗", without its description, naming the product's own industry (it can differ from the phase's).
  Badges show only the skills from the CV's "Technologies" line and the brief (`cardSkills`). Roles that ended more than
  10 years before the build month sit under an "Earlier experience" disclosure (`splitByAge`; the month comes from a
  `"use cache"` query, since the domain reads no clock). Each role is `#experience-<slug>`. Under a role's title, only
  the company: employment type, work mode and location stay in the data (chat and job match answer from them) but are
  not shown. Helpers are pure and tested (`features/portfolio/format.ts`, `timeline.ts`).
- **Skills:** grouped by the CV's categories (`skillGroups`), groups in the order of their most important skill, skills
  by `position`; each skill shows its tenure from `skillTenure` in `domain/rules` (the union of the periods of its role, phase and
  project links; [ADR 0009](docs/adr/0009-personal-projects-in-skill-years.md)),
  rounded **down** to whole years by `tenureLabel` ("10+ yrs", spoken "over 10 years" through `sr-only`), so a claim
  never overstates. Only the **top 12** (`topSkills`) are always visible; all of them, by category, sit behind "Show all
  N skills by category", which a `?skill=` link to a skill outside the top opens.
- **Skill filter:** each skill is a `<button aria-pressed>`; `?skill=<slug>` is the state, so a selection is a shareable
  link (the chat and job match link to skills). The page stays static: the server `components/skills.tsx` wraps the
  client `SkillFilter` (`useSearchParams`) in `<Suspense>` whose fallback is the same `SkillList` with nothing selected,
  so every skill is in the prerendered HTML; a press calls `window.history.replaceState` (no request, Back does not step
  through skills). The "Where it was used" panel (`SkillUsage`: tenure, roles linked to `#experience-<slug>`, the
  sources' context notes, and the personal projects as plain text, "<name> · personal project · <years>", since the
  page has no projects section to link to) is a sticky `aside` with `aria-live="polite"` on large screens and sits under the selected
  skill's group on small ones. Roles carry `data-experience`; each shows a client `SkillMatch` ("✓ <skill>", read as
  "Uses <skill>", teal border, `brand-soft`, 12px) in its own `<Suspense fallback={null}>`: the only highlight (years
  and rule keep their colours, non-matching roles are not dimmed). An effect scoped to `#experience` opens a closed
  "Earlier experience" when a role inside matches. On the first render only, a `?skill=` link scrolls to its fragment
  (`?skill=ngxs#experience-sware`, the shape the chat's source chips use), otherwise to the pressed skill through a
  `pressedRef`; that effect is declared after the timeline one, because opening "Earlier experience" moves everything
  below it. `toggledSkillSearch` and `selectedSkill` are pure and tested.
- **Case studies:** `caseStudyCards` (pure, tested) resolves each story's subject to its role and phase ("JWP Connatix ·
  Content management suite · 2023–2024", the company linked to `#experience-<slug>`); a story about a personal project
  has the subject "<name> · Personal project · <years>", as text without a link (the page has no projects section). Each card (`#case-study-<slug>`) shows the title and the context; the
  approach, outcome and what it shows are a `<dl>` in a native `<details>`. No category labels (not in the data).
- **How I work:** the CV summary's sentence about spec-driven development, word for word (`workflowIntro`, tested;
  `sentences` in `format.ts`, shared with the metadata), then the `workflow` steps as an `<ol>` of muted cards, each
  titled "1 · Specify" in mono teal (the number `aria-hidden`), three columns from `@2xl`.
- **Education, languages and footer:** `components/education-languages.tsx` renders two short sections side by side from
  `md` (`#education`, `#languages`; the CEFR level only when there is one). `components/layout/site-footer.tsx` is
  rendered by the root layout, so the 404 has it too: the name, the email address as text (a `mailto:` link), LinkedIn
  (new tab) and the accessibility statement link, from the profile. No "Let's talk." or "Built with Next.js" lines (no
  source).
- **Section navigation:** one indicator of the current section, in the header, no progress line. The client
  `SectionNav` renders the links inline from `md` and in a shadcn `Sheet` (focus trap, Esc, focus back to the trigger)
  below it; links are `/#<id>` (they work from the 404). The current section gets `aria-current="location"`, the text
  colour and a 2px teal underline (every link carries a transparent one, so the change is a 300ms colour transition,
  `motion-reduce:transition-none`). It comes from an `IntersectionObserver` over a band from the bottom of the header
  (the `--header-height` token, in px) to 45% down the screen, the first section in the band being current, not from
  scroll listeners reading layout; a second observer marks the last section once half of the footer (`#contact`) is in
  view; a pressed link wins until the reader scrolls (wheel, touch, key).
- **Typography:** Geist Sans for text, Geist Mono for periods, durations, labels and section titles. `h1` fluid from
  40px (phone) to 56px (desktop) with `clamp()`, headline 20 → 24px; body 16px, line-height 1.6. Reading width ~760px,
  content container 1040px. **Four-step scale** below the hero titles: 12px (`text-xs`, mono labels, badges, periods),
  14px (`text-sm`, secondary lines), 16px (`text-base`, everything meant to be read) and 20px (`text-xl`, card titles
  and section titles: mono, uppercase, tracked, semibold, in the text colour; no rules or borders added). Hierarchy
  comes from weight and colour, not 1px steps; no arbitrary `text-[…]` sizes. `<summary>` toggles get `py-0.5` (24px
  target) and 44px under `pointer-coarse`, through padding: a `display: flex` summary loses its disclosure marker.
- **No copy without a source:** every visible sentence about the owner comes from the data. "How I work" is the three
  steps Specify → Implement → Own the result stored as data (`WorkflowStep { slug, title, body, sourceSlug }`, table
  `workflow_steps`, port `WorkflowRepository`), worded in the first person from the employment brief's answer on AI
  tools, so the chat can answer "How do you work with AI tools?" from the same records.
- **AI in the UI:** the chat opens from an "Ask about me" button in the header (text plus the `⌘K` shortcut) and from
  the hero, as a 460px side sheet on desktop and full screen on phones. It speaks in the third person, by name ("Mirel
  worked…"), never as the owner, and every answer ends with source chips that link to the experience or phase in the
  timeline. Job match is its own route, `/job-match` (linked from the header and the hero as "Match me to your role"),
  so the home page stays static; requirement → linked evidence → level, where the level is shown as text and dots
  (Strong / Partial / Gap), never by colour alone. Until they work, the entry points are hidden: nothing on the page
  mentions the chat or job match.
- Use Base UI primitives (via shadcn/ui, base `base`, style `base-nova`) for dialogs, menus, tabs; don't hand-roll
  them. shadcn copies component source into `components/ui/`: we own it and fix its accessibility gaps there. Fixes
  applied after every `shadcn add`: focus is a solid `outline-ring` outline on `:focus-visible` (not `ring-ring/50`,
  which halves the contrast, and not a box-shadow ring, which forced-colors mode removes); menu items get the same
  outline, because their `bg-accent` highlight is only 1.07:1 against the popover; interactive parts get
  `pointer-coarse:min-h-11` (44px on touch). Components import `cn` from the `cn` package directly, so there is no
  `src/lib/utils.ts`. The outline variant uses `border-input` (3:1), not `border-border`. A link styled as a button
  uses `className={cn(buttonVariants(...))}`: `cva` only concatenates, so the base `border-transparent` and the
  variant's `border-input` would both stay and the stylesheet order would pick the winner; `cn` resolves the conflict
  in favour of the variant.
- Theme: `next-themes` (`attribute="class"`, `defaultTheme="system"`, `disableTransitionOnChange`) in the root layout,
  `suppressHydrationWarning` on `<html>` only. Its inline script sets the class before paint (no flash) and is allowed
  by the CSP's `'unsafe-inline'`. The toggle is a menu of radio items (Light / Dark / System, `closeOnClick` so focus
  returns to the trigger); the trigger icon switches through `dark:` CSS, never through `theme`, so server and client
  render the same markup.
- Streaming chat output goes through an `aria-live="polite"` region; dialogs move and restore focus.

## Responsive (first-class requirement)

UI and UX must work on every device: phone, tablet, laptop, large desktop, portrait and landscape. Mobile-first CSS
with intrinsic, fluid layouts. Desktop gets the most visitors, so every breakpoint is designed on purpose; desktop is
never a stretched phone layout.

- Mobile-first CSS: unprefixed Tailwind classes target small screens; `sm:`/`md:`/`lg:`/`xl:` add the larger layouts.
- Intrinsic layouts: flexbox/grid with `minmax()`, `auto-fit`, `gap`; breakpoints follow the content, not device names.
- Container queries (`@container`) for components (cards, highlights), so a component adapts to its slot.
- Fluid type and spacing with `clamp()`; `rem` units; readable line length (`max-w-prose`); no fixed heights.
- Works from 320px wide with no horizontal scroll, up to wide screens (content max width, no edge-to-edge text).
- Large screens keep their density: full navigation, two-column timeline, grids. Small screens: the section menu
  becomes a shadcn `Sheet` below `md`, the timeline becomes one column, tables (job match) become stacked cards, the
  chat panel opens full screen.
- Touch: larger targets (≥ 44×44px) only for coarse pointers (`pointer: coarse`), so desktop controls stay compact;
  WCAG 24×24px applies everywhere. Nothing works only on hover; inputs ≥ 16px font (no iOS zoom).
- `dvh` units and `env(safe-area-inset-*)` for full-height and fixed elements; `next/image` with `sizes`.
- Verified by Playwright projects for desktop and phone viewports (smoke + axe on both), Lighthouse with both the
  desktop and mobile presets, and a manual check on a real phone.

## SEO (first-class requirement)

Technical quality, people-first content, structured data and AI search (GEO). Reasoning and what is built:
[ADR 0007](docs/adr/0007-seo-baseline.md). Rules:

- **One page**; pages per case study (`/case-studies/[slug]`, static, own metadata, OG image and JSON-LD) only when a
  case study has substantial content (first candidate `this-portfolio`). Section and item anchors come from slugs
  (`#experience-jwp-connatix`, `#case-study-upgrade-sequencing`), so links keep working when pages are added.
- **Rendering:** all content is in the server-rendered HTML, never client-only. Core Web Vitals targets: LCP < 2.5s,
  INP < 200ms, CLS < 0.1.
- **One canonical origin, `https://mirelnan.dev`:** `metadataBase` (a string, because cached values must be
  serialisable) + `alternates.canonical`; the origin lives in `lib/site.ts`; `www` redirects to the apex.
- **Metadata from the data:** `features/portfolio/metadata.ts` → `portfolioMetadata(profile, currentRole)`, a tested
  pure function. Title "<name> · <current role>" from the newest experience ("Mirel Nan · Senior Frontend Engineer
  (Angular, React)"), ≤ 60 characters; description = the headline's role plus the intro's second sentence (the one
  naming the stack), ≤ 160; both word for word from the data; it throws, failing the build, above the limits.
  `og:site_name` is "<name> · Portfolio"; the root layout's `generateMetadata` has the title template `%s · <name>`.
  Own `app/not-found.tsx` (Next's default adds a second `<title>`). `<html lang="en">`.
- **Crawling:** `app/robots.ts` allows every crawler, including AI search and training crawlers (GPTBot, OAI-SearchBot,
  ClaudeBot, PerplexityBot, Google-Extended); `app/sitemap.ts` lists the URLs; an unknown URL returns a real 404.
- **Indexing only on production:** `lib/deployment.ts` → `isProductionDeployment()` = `VERCEL_ENV === "production"`,
  read at build. Anything else (previews, local builds) gets `robots.txt` → `Disallow: /` and `X-Robots-Tag: noindex`.
  `VERCEL_ENV` is declared in turbo.json `build.env` (strict env mode would drop it, and it splits the cache).
- **Structured data:** `features/portfolio/structured-data.ts`: JSON-LD `ProfilePage` + `mainEntity: Person` (`knowsAbout`
  = top 12 skills + `profile.competencies`, `sameAs` LinkedIn, `alumniOf`), rendered as an inline script through
  `jsonLdText`, which escapes `<` (the one sanctioned `dangerouslySetInnerHTML`: our own JSON, never model output).
- **Share image and AI search:** `app/opengraph-image.tsx`, a 1200×630 card drawn with `next/og` from the profile
  (dark-theme colours in hex, since the renderer has no OKLCH; Geist; alt text from the profile through
  `generateImageMetadata`, served at `/opengraph-image/card`), `twitter:card summary_large_image`;
  `app/llms.txt/route.ts` renders the site as Markdown from `features/portfolio/llms.ts` (owned highlights marked
  "(owned)", products left out). All prerendered from the cached reads.
- **Content:** facts only from the data; one `h1`, descriptive headings and link text, meaningful `alt`.
- **Verified by:** Lighthouse SEO = 100 (desktop and mobile); the Playwright tests for title, description, canonical,
  robots, JSON-LD and `robots.txt`/`sitemap.xml`/`llms.txt`. Google Search Console (a Domain property verified by a
  DNS TXT record at the registrar, no script; **the record must stay**) and Bing Webmaster Tools (imported from Search
  Console), sitemap submitted.
- No tracking or analytics script for SEO (privacy rule). Search impact is measured in Search Console.

## Security (first-class requirement)

Baseline: OWASP Top 10 + OWASP Top 10 for LLM Applications ([ADR 0005](docs/adr/0005-security-baseline.md)). Every
code review checks security.

- **HTTP headers:** from `apps/web/src/lib/security-headers.ts` (`securityHeaders({ production })` and
  `contentSecurityPolicy({ production, development })`, tested), applied to `/:path*` in `next.config.ts`, with
  `poweredByHeader: false`. CSP: `default-src 'self'`, everything else from this origin, `frame-src`/`frame-ancestors`/
  `object-src 'none'`, `base-uri`/`form-action 'self'`, `'unsafe-inline'` for scripts and styles (the prerendered page
  carries ~47 inline scripts that change with each build; a nonce would make the page dynamic, and hashes cannot reach
  headers fixed before the build; accepted, since no user input is rendered as HTML, see the ADR). `'unsafe-eval'` only
  under `next dev`; the Vercel toolbar's hosts (`vercel.live`…) only off production; `upgrade-insecure-requests` only on
  production (it would break `http://localhost`). The JSON-LD script is a data block the CSP does not govern. Also HSTS
  (2 years, preload), nosniff, `Referrer-Policy: strict-origin-when-cross-origin`, a restrictive `Permissions-Policy`
  (list only features Chrome recognises: `browsing-topics` was removed), `X-Frame-Options: DENY`,
  `Cross-Origin-Opener-Policy: same-origin` (isolation, not for the score). Observatory scores B+ (80/100); the only
  failed test is `'unsafe-inline'`. Experimental Next SRI is not worth it yet.
- **Input:** every API input validated with zod (types + max lengths) at the boundary; body size limits; rate limiting
  (Upstash) on every `/api/*` route; generic error messages, no stack traces to the client.
- **Rate limiting:** `server/rate-limit.ts` (`server-only`) → `createRateLimit({ name, requests, window })`, created at
  module scope in the route (so the limiter's in-memory cache of blocked clients lives as long as the instance);
  `const limited = await rateLimit(request); if (limited) return limited;` at the top of the handler. Upstash
  `slidingWindow` per client IP (`ipAddress()` from `@vercel/functions`: the header Vercel's edge sets, `"unknown"`
  locally), key prefix `ratelimit:<name>`, one prefix per route; `waitUntil(pending)`. The 429 comes from the pure,
  tested `lib/rate-limit.ts` (`tooManyRequests`: generic JSON, `Retry-After` in whole seconds rounded up, `no-store`).
  Every `/api/*` GET starts with `await connection()`, or Cache Components prerenders it at build. Fails open on an
  Upstash timeout (the library's 5s default; revisit for `/api/chat`), closed on missing variables (500).
  `/api/health` (`{ "status": "ok" }`, no DB, no version info) is the cheap route that proves the limiter
  (10 per 10s). One Upstash database (Frankfurt, Free plan, created in the Upstash console, not through the Vercel
  integration; no payment method on the account), shared by production, previews and local runs.
- **Secrets:** validated with zod in `server/env.ts`, one schema per moment they are read: `readServerEnv`
  (`DATABASE_URL`) when the composition root loads, because the build needs it; `readRateLimitEnv` (Upstash) lazily on
  the first API request, so the build and CI never need those secrets. Never `NEXT_PUBLIC_`; modules using them import
  `server-only`; gitleaks in lefthook + GitHub secret scanning with push protection.
- **AI:** the user's text and job descriptions are untrusted (prompt injection). Tools are **read-only** and only
  return public CV data; no secrets or private data in prompts; `max_tokens` and conversation length capped; model
  output rendered as text/sanitized markdown (never `dangerouslySetInnerHTML`); job-match output validated with zod;
  spend limit set in the Anthropic console.
- **Chat history ([ADR 0010](docs/adr/0010-signed-chat-turns.md)):** no conversation is stored on the server; the browser
  sends the history back on each request. Every assistant turn is signed by the server (HMAC-SHA256 over role,
  conversation id, position, content and the issue and expiry times, key ≥ 256 bits from the environment, never in the
  client). The server keeps only the turns whose signature, conversation id, position and expiry check out, and reads
  the signed fields only through `verifyAssistantTurn`. The conversation id is a server-generated UUID, signed with each
  turn. Before a verified turn reaches `chatConversationSchema`, the route keeps only `role` and `content`. Signing code
  is in `apps/web/src/server/chat-turn-signature.ts`, with its tests next to it.
- **Database:** the runtime uses a read-only Postgres role; migrations/seed use a separate role; TLS required; queries
  only through Drizzle (parameterized), no string-built SQL.
- **Supply chain:** frozen lockfile in CI, `pnpm audit`, Dependabot, install scripts allowed only via `allowBuilds`;
  GitHub Actions pinned to commit SHA with minimal `permissions:`. `minimumReleaseAge: 10080` (7 days) in
  `pnpm-workspace.yaml`, which pnpm 12 also enforces on the lockfile (a `--frozen-lockfile` install fails on a too-young
  entry), with `minimumReleaseAgeExclude` only for the daily browser-data packages (`caniuse-lite`,
  `electron-to-chromium`) and, temporarily, exact versions with a dated comment saying when to remove them.
  `.github/dependabot.yml`: weekly npm and github-actions updates with a 7-day `cooldown`, minor and patch grouped in
  one pull request, Conventional titles (`build(deps): …`, `ci: …`), `typescript` major ignored; security updates are
  not delayed. Repository settings: Dependabot alerts and security updates, secret scanning with push protection,
  CodeQL default setup.
- **Repo / platform:** protected `main` (see "Working in this repo"), Vercel Deployment Protection on previews,
  `SECURITY.md` (scope, private reporting through GitHub private vulnerability reporting or email, a 7-day answer,
  good-faith limits) and `apps/web/public/.well-known/security.txt` (RFC 9116, static), whose `Expires` is checked by
  `apps/web/src/lib/security-txt.test.ts`: it fails 30 days before the date, so CI asks for the yearly renewal.
- **Runbook:** `docs/runbook.md` (the platforms inventory, deploying, changing the database, rotating the reader and
  the Upstash token, rolling back, dependencies, the yearly tasks). The inventory names variables, never values;
  account details and 2FA recovery codes stay in the owner's password manager. Update it in the same change whenever one of those procedures changes.
- **Privacy:** no tracking cookies, so no consent banner; no third-party scripts without a reason. Analytics = Vercel
  Web Analytics (cookieless, served first-party from `/_vercel/insights`, so the CSP stays `'self'`; `<Analytics />`
  from `@vercel/analytics/next` in the root layout, enabled in the Vercel dashboard; it sends nothing outside Vercel
  deployments). Google Analytics is ruled out (cookies → consent banner, a third-party script that costs INP/LCP,
  partial data).

## Content rules

### Approved sources

Claims about the owner come **only** from registered sources ([ADR 0006](docs/adr/0006-content-sources-and-projects.md),
[0008](docs/adr/0008-skills-matrix-source.md)). Each source is a record in `cv-data` (`{ slug, kind, title }`); every
claim points to one with `sourceSlug`. The kinds are fixed in `domain`:

| Kind               | Document                                                                                                                                                   | Rules                                    |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| `cv`               | the owner's CV                                                                                                                                             | used as written                          |
| `employment-brief` | owner's notes on client work, today `jwx-brief` (the JWX work and its phases, the four case studies, owned vs contributed, context notes, the AI workflow) | exclusions + confidentiality rules below |
| `project-brief`    | owner's notes on a personal project they fully own                                                                                                         | only released, public facts              |
| `skills-matrix`    | owner's list of the technologies used in each role, the full version of the CV's "Technologies" lines                                                      | names as in the CV                       |

Documents are transcription material only: the app and the AI never read them, and their location is never stored in
the data. Adding a source is approving it, so it goes through review. Never add a claim without a `sourceSlug` that
points to a registered source.

**Skills:**

- The skill list is the CV's "Technical skills": the CV's names and groups, in the owner's ranking (`position` =
  importance; the page orders categories by their best skill, then skills by position). No versions in names ("Angular",
  not "Angular 12+"); AngularJS is a separate skill. Broad terms ("Web Development") are not skills: they are
  `profile.competencies`, used only for SEO (`knowsAbout`) and never shown.
- Every skill is linked to at least one experience or personal project (a content test). A skill used only in a
  project (the site's own stack) is linked there, with the project brief as its source. A link's source is `cv` when the role's
  "Technologies" line names it (that line is also the card order), the JWX brief when the brief states it (with its
  context note), otherwise `skills-matrix`. JWX links carry the phase where the skill was used in only one.
- Years per skill come from these links: the union of the periods (the phase's when there is one, the project's for a
  project link), so overlaps count once ([ADR 0009](docs/adr/0009-personal-projects-in-skill-years.md)). Never state
  years that the links don't give.
- Slugs are stable (`?skill=` links): change one only with a deliberate decision.
- **`packages/cv-data/README.md`** is the how-to for new content (a skill, an experience, a product) and the list of
  checks that catch mistakes. Update it in the same change whenever that workflow changes: a new collection or source,
  a new generator, a new content test or schema rule, a changed deploy order.
- **Generated, never edited by hand:** `src/skills.ts` and each experience's `skills` block come from
  `packages/cv-data/scripts/generate-skills.ts` (`pnpm --filter @mirelnan/cv-data generate:skills`; runbook in
  `scripts/README.md`). It reads the CV PDF (`pdftotext`) and the CSV (inputs git-ignored, so the private inputs cannot
  be committed); the ranking, aliases, broad terms and slug overrides are in `scripts/skills-config.ts`. It computes
  every file before writing any, so a failed check changes nothing, then runs Prettier. A brief link keeps its source
  and note. `scripts/` has its own `tsconfig.json` (node preset, checked by `typecheck`) and an ESLint override that
  allows Node built-ins and `console` there only.

**Excluded topics.** The owner keeps a list of topics from the employment brief that never go into the data, the UI or
chat answers. The list is private (`CLAUDE.local.md`), because the terms themselves would reveal what they exclude. It
is enforced by the `private terms` pre-commit job, which greps staged `cv-data` files against the git-ignored pattern
file `.private-terms.local`; the public `cv-data` content tests check only what reveals nothing (phone numbers, change
counts).

### Personal projects

- A `Project` is in the data only once it is released (`releasedOn` is required); work in progress stays in the
  project's brief. Unreleased plans are treated like a client's unreleased roadmap. A `cv-data` content test rejects a
  `releasedOn` or `offlineSince` later than the current month (kept out of the `domain` schema, which stays pure and
  does not read the clock).
- Links are optional and public only (no private repositories). Once `offlineSince` is set, the website and store
  links are hidden everywhere (`visibleLinks`), because an expired domain can be bought by someone else.
- Personal projects are fully owned, so they have no `ownership` field.
- Case studies are optional, zero or more per experience or project; `about` says which.

### Product context

Product/industry descriptions (JWX Portal, JWX Dashboard, Res_Q, HPI Check) are public context with `source_url`, never
evidence of contributions; no vendor marketing numbers, no logos. A product is named as its public page names it
(`portal.connatix.com` is titled "JWX Portal"), never by an internal name. When no public page describes what a product
does, the description states only sourced facts (JWX Portal: the Connatix–JW Player merger press release). The JWX
phases themselves stay generic ("content management suite", "video platform dashboard"). Product descriptions are shown
**on the site only** (product cards): AI tools never return them, so the chat, job match and MCP server cannot use them.

### Ownership

Highlights carry `ownership: "owned" | "contributed"`. Owned: metering & billing, both framework upgrades, the
shared-library extraction, the CI/CD pipeline for the shared libraries and the spec-driven delivery of the 2026 feature
work (the last two because the CV says "owned"). The AI media-transformation build-out is `contributed`: it was team
work. Never present `contributed` as `owned`, never claim a whole product.

### JWX phases

Two phases, as in the brief: `content-management-suite` (2023-03 – 2024-12, `video-content-management`; it includes
the suite's advertising side) and `video-platform-dashboard` (2025-01 – 2026-10, `video-tech`, linked to the JWX
Dashboard product); the first phase is linked to the JWX Portal product. The phase months come from the brief. A CV
bullet the brief places in a phase gets that `phaseSlug`; a CV bullet the brief does not place stays on the experience.
The brief adds only work the CV does not mention; its details on work the CV already lists go into the case studies.

### Confidentiality (applies to site, data, chat, job match, MCP)

- No internal ticket IDs, branch names or repository links.
- No internal product codenames, no feature-flag names.
- No unreleased roadmap, no business figures (revenue, customer counts, pricing).
- No architecture detail precise enough to reproduce: describe the shape of the problem, not the internals.
- Code from client work is **never** a content source (the local paths are in `CLAUDE.local.md`).
- The chat declines such requests with: "That's covered by a confidentiality agreement, so I can describe the shape of
  the problem instead."

### Always

- **Never include the phone number** anywhere (data, seed, UI, PDFs, fixtures). The `Profile` type has no `phone`
  field. The only CV PDF allowed in the repo is the no-phone export, as `apps/web/public/mirel-nan-cv.pdf` (its source
  file is named in `CLAUDE.local.md`); re-check any new export for phone traces (text, `tel:` links, metadata) before
  committing it.
- The chat, job match and MCP server answer **only** from registered sources (the CV, employment briefs, project
  briefs), through tool results over the database, with the exclusions and confidentiality rules above applied, and say
  "not in the CV" otherwise: never from the model's general knowledge or from product pages.

## Secrets

Only in `.env.local` (git-ignored) and Vercel project settings. Each consumer has its own `.env.example` next to it,
listing only the variables that process needs (least privilege: the web app never holds the owner URL):

| Where                          | Variable                                             | Role / use                                                                   |
| ------------------------------ | ---------------------------------------------------- | ---------------------------------------------------------------------------- |
| `packages/db/.env.local`       | `DATABASE_ADMIN_URL`                                 | Neon owner role, direct (unpooled); only `db:migrate` and `db:seed`, locally |
| `apps/web/.env.local` + Vercel | `DATABASE_URL`                                       | read-only role `portfolio_reader`, pooled                                    |
| `apps/web/.env.local` + Vercel | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | rate limit; the standard REST token (the limiter writes), read at request    |
| `apps/web` + Vercel (stage 1+) | `ANTHROPIC_API_KEY`                                  | Claude API                                                                   |

On Vercel, a secret is saved as a **Sensitive** environment variable (its value can no longer be read back, only
replaced), for Production **and** Preview (a pull request's preview build runs with the Preview variables; without
`DATABASE_URL` it fails with the `env.ts` error); a plain one makes Vercel flag it as "Needs attention". A variable
cannot be switched to Sensitive: delete it and add it again. Rotating the reader (`db:reader` again): the old password
stops working at once, so update `apps/web/.env.local` (the script writes the direct host: add `-pooler`) and the
Vercel variable, then redeploy. The live static page keeps working meanwhile; only new builds need the new URL. Delete
`packages/db/.env.reader.local` once copied.

Connection strings use `sslmode=verify-full` (node-postgres treats `require` as an alias and warns). Errors about a
variable never echo its value. The Neon store is never connected to the Vercel project (the integration would inject
the owner `DATABASE_URL` into the app): set the reader URL by hand.

## Tooling decisions

- Shared versions live in the pnpm **catalog** (`pnpm-workspace.yaml`); packages use `"catalog:"`. Internal packages use
  `workspace:*`. Tool-config packages declare the tool as a `peerDependency`.
- **Node 26** (Active LTS, end of life 2029-04-30). One source per tool: `.nvmrc` (`nvm use`, CI's `setup-node`),
  `engines.node` in the root `package.json` (`>=26`) and in `apps/web/package.json` (`26.x`, which Vercel reads from
  the Root Directory), `@types/node` 26 from the catalog. Node 26 no longer ships Corepack:
  `npm install -g corepack && corepack enable pnpm` locally; CI installs pnpm with `pnpm/action-setup`. The TypeScript
  target stays ES2024 (browsers, not Node, set that floor).
- **TypeScript 6.0.x**, not 7: Next.js, typescript-eslint and drizzle-kit need the JS compiler API.
- **ESLint 10**. `eslint-config-next` wraps `eslint-plugin-react` and `eslint-plugin-import` for ESLint 10 itself, and
  `jsx-a11y` works unwrapped, so no `@eslint/compat`. Their peer ranges stop at ESLint 9:
  `peerDependencyRules.allowedVersions` in `pnpm-workspace.yaml` allows 10 for exactly those three plugins.
- **Next.js 16.4.x** (exact, `eslint-config-next` the same version, in `@mirelnan/eslint-config`), React 19.3.x exact,
  Tailwind 4.3.x exact with `@tailwindcss/turbopack` (Tailwind as a Turbopack loader, no PostCSS config).
  `next.config.ts`: `cacheComponents: true` (prerendered by default, `"use cache"` for cached data, instead of
  route-level ISR `revalidate`) with `partialPrefetching: true`, `agentRules: false` (no generated `AGENTS.md`). The
  docs for the installed version are in `apps/web/node_modules/next/dist/docs/`: read the relevant guide there before
  writing Next.js code, because APIs changed after the model's training data.
- `apps/web` `typecheck` is `next typegen && tsc`: typegen writes the route types (`LayoutProps<"/">`, `PageProps`)
  into `.next/types`, which `tsconfig.json` includes. `apps/web/turbo.json` (`extends: ["//"]`) makes the web `build`
  depend on `typecheck`: `next build` empties `.next/` when it starts, so run in parallel, `tsc` could find the route
  types deleted (TS6053).
- Before picking any version: check latest, **support/EOL status** and peer ranges; test in a scratch dir if unsure. A
  new dependency version must be at least 7 days old (`minimumReleaseAge`), unless it is a security fix; pin it exact
  when the package is pre-1.0 or releases daily.
- Dependency install scripts are blocked by pnpm; decisions are recorded in `allowBuilds` in `pnpm-workspace.yaml`
  (`lefthook: false`: hooks are installed by our own root `prepare` script instead; `esbuild: false`: drizzle-kit needs
  it, and its platform binary arrives as an optional dependency).
- **Drizzle ORM 0.45.x + drizzle-kit 0.31.x**, exact versions in `packages/db` (1.0 is still a release candidate).
- Prettier runs once from the root (not via Turbo); ESLint and `tsc` run per package via Turbo. Tool-managed files
  (`pnpm-lock.yaml`, `pnpm-workspace.yaml`) are in `.prettierignore`.
- Git hooks (`lefthook.yml`): pre-commit = gitleaks on staged diff, then Prettier on staged files, then ESLint
  (`piped`); commit-msg = commitlint. ESLint is a `group` with one parallel job per package that has an
  `eslint.config.js` (`root: packages/<name>/`, `glob: "*.{ts,tsx,js,mjs,cjs}"`, `pnpm exec eslint {staged_files}`): the
  same command as `pnpm lint`, no `--fix` (only Prettier rewrites staged files). A new package or app adds its job when
  it gets its ESLint config. Hooks are a convenience, not a control: CI re-runs everything.
- **Vercel** (dashboard settings): Root Directory `apps/web` ("Include files outside the root directory" on), framework
  Next.js with the default commands; Vercel detects `turbo.json` and runs `turbo run build`, so `apps/web/turbo.json`
  applies there too. Node comes from `engines` (26.x). pnpm comes from `packageManager` through Corepack
  (`ENABLE_EXPERIMENTAL_COREPACK=1`; without it Vercel picks pnpm 9/10 from the lockfile version); that variable is in
  turbo.json `globalPassThroughEnv`. `DATABASE_URL` = the reader's pooled URL, set by hand for Production and Preview.
  Standard Deployment Protection (previews need a Vercel login, production is public). Function region `fra1`, next to
  Neon in Frankfurt, for the dynamic routes of stages 1–2 (the home page is static and reads Neon only at build). The
  remaining Vercel warning that `typecheck` does not get `DATABASE_URL` is intended.
- **CI** (`.github/workflows/ci.yml`): one job on `ubuntu-24.04` with a throwaway Postgres 18 service (image pinned by
  digest, `trust` auth, no secrets: it only ever holds the seeded public data), because `next build` prerenders from a
  database. Steps: `pnpm install --frozen-lockfile --ignore-scripts` → `pnpm audit --audit-level=high` →
  `format:check` → `db:check` → `db:migrate` → `db:seed` → `turbo run lint typecheck test build` → Playwright
  (accessibility section). Actions are pinned to a commit SHA (release in a comment, ≥ 7 days old),
  `permissions: contents: read`, `persist-credentials: false`, `concurrency` cancels superseded runs. CI never touches
  Neon.
- `packages/db/vitest.config.ts` raises `hookTimeout` (60s) and `testTimeout` (30s): booting PGlite takes ~3s on two
  free cores and over Vitest's 10s default on a busy CI runner.
- gitleaks is a system binary (`~/.local/bin`, installed from the official release with checksum check), not an npm
  package.
- **Package template** (set by `packages/domain`): `exports` points at TS source (`./src/index.ts`, no build),
  `sideEffects: false`, scripts `lint: eslint .`, `typecheck: tsc`, `test: vitest run`; `tsconfig.json` extends a preset
  with `include: ["src", "vitest.config.ts"]`; `vitest.config.ts` sets `test.name` to the package's short name (it
  labels the output and the GitHub Actions job summary); `eslint.config.js` extends a preset and sets
  `tsconfigRootDir: import.meta.dirname` (needed when ESLint runs over several packages at once). `index.ts` lists
  public exports by name (no `export *`).
- **Vitest 5** for unit tests: explicit `import { describe, it, expect } from "vitest"` (no globals, so library
  packages need no extra `types`), tests next to the code, table-driven with `it.each`; test through the public API.
  Turbo `test` has no outputs until coverage is enabled in CI.
- `--save-catalog` only for external packages; never in the same `pnpm add` as `workspace:*` packages.
- **Domain schemas** (zod 4): every object is `z.strictObject`; types come from `z.infer`. References between entities
  are `<entity>Slug` (`industrySlug`, `phaseSlug`, mirroring `<entity>_id` in the DB); identity in the domain is the
  slug, never a DB id. Provenance is `sourceSlug` (a registered source), never an enum of documents. Periods are a
  `Period` value object `{ start, end }` (`end: null` = ongoing). Cross-field rules (`refine`/`superRefine`) pass
  `when: (payload) => payload.issues.length === 0`, because zod still runs them after a field failed. Aggregate
  invariants live in the aggregate's schema; cross-aggregate references (a case study's experience exists) are checked
  by the `cv-data` tests and DB foreign keys.
- **`CvData`** is `z.infer<typeof cvDataSchema>` (`domain/entities/cv-data.ts`): the whole snapshot, validated by the
  `cv-data` tests and again by the seed before it writes. `cv-data` holds one file per collection (one per experience)
  and `cv.ts` assembles them. Data files end in `satisfies X[]` (checked, inferred type kept); `cv.ts` annotates
  `cvData: CvData` (the exported contract; an empty list is `Project[]`, not `never[]`). Its tests check schemas, unique
  slugs, every `*Slug` reference, no phone-like number, the excluded brief topics, no future release dates, every skill
  linked to an experience and no competency that is also a skill.
- **Repositories (ports):** one read-only interface per aggregate root (11, including `sources`, `projects` and
  `workflow`) in `domain/src/repositories/`, bundled in `Repositories`. Methods return promises; a missing item is
  `null`, not an exception. Only methods a known consumer needs (no generic CRUD; the seed writes through `db`
  directly). Consumers take only the ports they need (`Pick<Repositories, …>`); the AI layer never gets `products`. The
  in-memory adapter is a separate entry point, `@mirelnan/domain/testing`, so test helpers stay out of the main API.

## Commands

| Command                                                                  | What it does                                                                             |
| ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| `pnpm install`                                                           | install; on a fresh clone also runs `prepare` → `lefthook install`                       |
| `pnpm run prepare`                                                       | (re)install git hooks — pnpm 12 skips `prepare` when the install is "Already up to date" |
| `pnpm format` / `pnpm format:check`                                      | Prettier write / check over the whole repo (CI uses `check`)                             |
| `pnpm lint` / `pnpm typecheck` / `pnpm test` / `pnpm build` / `pnpm dev` | Turbo tasks across packages                                                              |
| `pnpm exec lefthook validate`                                            | validate `lefthook.yml`                                                                  |
| `gitleaks git --redact .`                                                | scan the whole git history for secrets                                                   |

Database: `pnpm --filter @mirelnan/db db:generate --name <name>`, `db:check`, `db:migrate`, `db:seed`, `db:reader` (see
`packages/db/README.md`).
