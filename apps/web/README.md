# @mirelnan/web

The site at [mirelnan.dev](https://mirelnan.dev): a Next.js 16 app (App Router, Cache Components) that renders
the portfolio from Postgres. It is an inbound adapter of the layered architecture: it reads the data only through
the repository interfaces of `@mirelnan/domain`, wired once in `src/server/container.ts`, and never imports Drizzle,
`pg` or `@mirelnan/cv-data` (an ESLint rule enforces it).

## Structure

```
src/
├─ app/                    routing only: layout, page, 404, robots, sitemap, the share image, /llms.txt
├─ features/portfolio/     the portfolio feature
│  ├─ queries.ts           every read, cached ("use cache" + cacheLife("max")), server-only
│  ├─ *.ts                 pure, tested helpers: highlights, timeline, skills, case studies, metadata,
│  │                       structured data, llms.txt, format (years, durations, tenure)
│  └─ components/          the sections; Server Components unless they need the browser
├─ components/layout/      header, section navigation, theme toggle, skip link, footer
├─ components/ui/          shadcn/ui components on Base UI, with our accessibility fixes
├─ lib/                    security headers, deployment flags, the canonical origin
└─ server/                 env validation and the composition root (server-only)
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

## Environment

| Variable       | Where                            | What                                                                             |
| -------------- | -------------------------------- | -------------------------------------------------------------------------------- |
| `DATABASE_URL` | `.env.local`, Vercel (Sensitive) | the read-only role `portfolio_reader`, pooled host; validated in `server/env.ts` |
| `VERCEL_ENV`   | set by Vercel, read at build     | `production` turns on indexing and the production security headers               |

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

| Script           | What it does                                                                 |
| ---------------- | ---------------------------------------------------------------------------- |
| `pnpm dev`       | `next dev`                                                                   |
| `pnpm build`     | `next build` (Turbo runs `typecheck` first); needs `DATABASE_URL`            |
| `pnpm typecheck` | `next typegen && tsc`: route types first, then the compiler                  |
| `pnpm lint`      | ESLint with the `next` preset (jsx-a11y strict, layer boundaries)            |
| `pnpm test`      | Vitest: the helpers, the env validation, the headers and the colour contrast |

Run them from the root with `pnpm --filter @mirelnan/web <script>`.
