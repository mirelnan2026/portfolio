# @mirelnan/web

The site at [mirelnan.dev](https://mirelnan.dev): a Next.js 16 app (App Router, Cache Components) that renders
the portfolio from Postgres. It is an inbound adapter of the layered architecture: it reads the data only through
the repository interfaces of `@mirelnan/domain`, wired once in `src/server/container.ts`, and never imports Drizzle,
`pg` or `@mirelnan/cv-data` (an ESLint rule enforces it).

## Structure

```
src/
├─ app/                    routing only: layout, page, 404, /accessibility, robots, sitemap, the share image,
│                          /llms.txt, /api/health
├─ features/portfolio/     the portfolio feature
│  ├─ queries.ts           every read, cached ("use cache" + cacheLife("max")), server-only
│  ├─ *.ts                 pure, tested helpers: highlights, timeline, skills, case studies, metadata,
│  │                       structured data, llms.txt, format (years, durations, tenure)
│  └─ components/          the sections; Server Components unless they need the browser
├─ features/chat/          the chat: request.ts parses and verifies the request before the model,
│                          turn.ts runs the tool-use loop (timeout, step limit, cancellation, generic errors),
│                          handler.ts turns one request into a signed answer (tested with a fake client);
│                          messages.ts holds the error lines both sides know, client.ts the browser's pure logic
│                          (request body, reading a reply, limits), components/chat-panel.tsx the panel
├─ components/layout/      header, section navigation, theme toggle, skip link, footer
├─ components/ui/          shadcn/ui components on Base UI, with our accessibility fixes
├─ lib/                    security headers, deployment flags, the canonical origin, the 429 and 503 responses
└─ server/                 env validation, the composition root, the rate limiter and the chat turn
                           signature (server-only; the signature functions are pure, see ADR 0010)
e2e/                       Playwright specs: axe on every page and theme and on the chat's states, smoke,
                           headers, SEO, the chat panel against a faked /api/chat
```

## How data reaches the page

```
Neon (read-only role) → server/container.ts → features/portfolio/queries.ts ("use cache")
                                                  → app/page.tsx, opengraph-image.tsx, llms.txt/route.ts
```

Every route is prerendered at build (`○ /`, `○ /llms.txt`, `● /opengraph-image/card`) and served from the CDN; the
CV changes only through a reseed, which ships with a deploy. So `next build` needs `DATABASE_URL`, and on every
deploy that touches data the order is migrate → seed → build (see [`docs/runbook.md`](../../docs/runbook.md)).

The parts that need the browser are small client components: the theme toggle, the section navigation (an
`IntersectionObserver` marks the current section), and the skill filter, which reads `?skill=` with
`useSearchParams` inside a `<Suspense>` whose fallback is the same list, so every skill is in the static HTML.

The chat panel is the one larger client component, and it is in the page only when the build has
`CHAT_ENABLED=true`. `next.config.ts` inlines that variable, and the root layout compares it directly
(`process.env.CHAT_ENABLED === "true" ? <ChatPanel /> : null`), so a build without it drops the import and ships
none of the chat's JavaScript. Keep the comparison in the layout: behind a helper, only the HTML would be hidden
([ADR 0013](../../docs/adr/0013-build-time-feature-flags.md); adding a flag: [runbook](../../docs/runbook.md#feature-flags)).
The panel keeps the conversation in the browser and sends the signed answers back unchanged (ADR 0010); answers are
rendered as text, never as HTML.

## Environment

| Variable                   | Where                            | What                                                                                                                         |
| -------------------------- | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`             | `.env.local`, Vercel (Sensitive) | the read-only role `portfolio_reader`, pooled host; validated in `server/env.ts`                                             |
| `VERCEL_ENV`               | set by Vercel, read at build     | `production` turns on indexing and the production security headers                                                           |
| `UPSTASH_REDIS_REST_URL`   | `.env.local`, Vercel (Sensitive) | Upstash Redis REST endpoint for rate limiting; read on the first API request, never at build                                 |
| `UPSTASH_REDIS_REST_TOKEN` | `.env.local`, Vercel (Sensitive) | its standard token (the limiter writes)                                                                                      |
| `ANTHROPIC_API_KEY`        | `.env.local`, Vercel (Sensitive) | Claude API key for the chat; read on the first chat request, never at build                                                  |
| `CHAT_SIGNING_KEY`         | `.env.local`, Vercel (Sensitive) | HMAC key for the chat's assistant turns (ADR 0010): 32 random bytes, base64url; a different key per environment              |
| `CHAT_ENABLED`             | `.env.local`, CI, Vercel Preview | `true` builds the chat panel into the page; inlined at build, so a change needs a new deploy; not on Production until launch |

Copy `.env.example` to `.env.local`; the reader URL comes from `pnpm --filter @mirelnan/db db:reader`.

## Design rules

- **Colours** are tokens in `src/app/globals.css` (OKLCH, `:root` and `.dark`); components never use raw colours.
  `theme-contrast.test.ts` checks every text pair (4.5:1) and the focus ring and inputs (3:1) in both themes.
  One accent, teal (`brand`), for information only.
- **Type scale** below the hero: 12px mono labels, 14px secondary text, 16px body, 20px card and section titles.
- **Accessibility:** WCAG 2.2 AA; native `<details>` for disclosures, `aria-pressed` and `aria-current` for state,
  never colour alone; 44px targets under `pointer: coarse`; reduced motion respected.
- **No copy without a source:** every sentence about the owner comes from the data.
- **Security headers** come from `src/lib/security-headers.ts`, including the Content Security Policy
  ([ADR 0005](../../docs/adr/0005-security-baseline.md)).

Adding a shadcn component: `pnpm --filter @mirelnan/web exec shadcn add <name>`, answer **N** to overwriting
`button.tsx`, then apply the fixes listed in the root `CLAUDE.md` (solid focus outline, `pointer-coarse` targets,
`motion-reduce` transitions).

## Scripts

| Script           | What it does                                                                                          |
| ---------------- | ----------------------------------------------------------------------------------------------------- |
| `pnpm dev`       | `next dev`                                                                                            |
| `pnpm build`     | `next build` (Turbo runs `typecheck` first); needs `DATABASE_URL`                                     |
| `pnpm typecheck` | `next typegen && tsc`: route types first, then the compiler                                           |
| `pnpm lint`      | ESLint with the `next` preset (jsx-a11y strict, layer boundaries)                                     |
| `pnpm test`      | Vitest: the helpers, the env validation, the rate-limit response, the headers and the colour contrast |
| `pnpm test:e2e`  | Playwright + axe against the production build (run `pnpm build` first)                                |
| `pnpm eval`      | the chat's evaluation set against a real model; see [Evaluations](#evaluations)                       |

Run them from the root with `pnpm --filter @mirelnan/web <script>`.

## Evaluations

`evals/` checks the chat's behaviour with the real model: `cases.ts` holds the questions and what a good answer must
(and must not) do; `graders.ts` decides pass or fail with code (no model judges), on the answer the visitor reads:
after `withoutSourcesTags`, as the chat route signs it; `budget.ts` prices each request
and stops at $3.50; `run.ts` runs the cases and writes each answer to `evals/results/` (git-ignored).

A case can require a phrase (`mustContain`), a pattern the answer must match (`mustMatch`) or must not match
(`mustNotMatch`), the tools that must be called, and the search terms they must use. Every case also fails when the answer names a
tool (`list_skills`), which the prompt forbids. A `<sources>` tag the model wrote is removed before grading, as in
production, and counted: the summary says how many answers had one, and each result line has `wroteSourcesTag`. Each
report line shows the question's progress, the model requests it took (`steps`), the tools called and the cost.

```
pnpm --filter @mirelnan/web eval -- --model claude-haiku-5-5 --repeats 3
```

`--only <id,id>` runs just the named cases (an unknown id is an error), to measure a fix on the cases it targets
before the full run that sets the baseline. A case with `history` sends earlier turns first, each answer with its
`<sources>` note, as the chat route does (ADR 0012).

It needs `ANTHROPIC_API_KEY` and a `DATABASE_URL` with the read-only `portfolio_reader` role in `.env.local`;
the runner refuses any other role. Unit tests for the graders, the budget and the case list run in `pnpm test`.

A case that depends on the CV's data declares it as `dataFact`, for example "Kubernetes has no hits in `search_cv`".
Before asking the model, the runner checks the fact against the database. If it no longer holds (a skill was added
or removed with `db:seed`), the case is reported as `STALE` and the model is not asked: the case must be updated,
not the model blamed.

**Baseline and model.** Haiku 5.5 is the default for the chat: 95 of 95 in a 5-repeat run (2026-11-25, about $0.06).
Sonnet 5.5 was compared on the same cases and cost about 20 times more; it is kept for comparisons only. Results are
written to `evals/results/` (ignored by git). Repeat the run after a change to the prompt, the tools, the cases or the
data, and periodically to catch changes made by the provider.
