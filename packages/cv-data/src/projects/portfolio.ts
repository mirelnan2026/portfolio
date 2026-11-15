import type { Project } from "@mirelnan/domain";

/** This site. Only released, public facts from the project brief; the numbers and unreleased plans stay there. */
export const portfolio = {
  slug: "portfolio",
  name: "mirelnan.dev",
  summary:
    "My portfolio site: a layered TypeScript monorepo with a Next.js app prerendered from Postgres, " +
    "built spec-driven with an AI agent.",
  period: { start: "2026-11", end: null },
  releasedOn: "2026-11",
  offlineSince: null,
  links: {
    website: "https://mirelnan.dev",
    repository: "https://github.com/mirelnan2026/portfolio",
    archive: null,
    mobileApp: null,
  },
  highlights: [
    {
      body:
        "Designed a layered monorepo (pnpm workspaces and Turborepo): a pure domain package with zod schemas " +
        "and repository interfaces, a Postgres adapter with Drizzle, and a Next.js app that reads only through " +
        "those interfaces, with the import rules enforced by ESLint.",
      featured: null,
      sourceSlug: "portfolio-brief",
    },
    {
      body:
        "Every claim on the site points to a registered source and is validated before the seed writes it; " +
        "the page is prerendered from Postgres at build time and served from a CDN.",
      featured: null,
      sourceSlug: "portfolio-brief",
    },
    {
      body:
        "Enforced WCAG 2.2 AA in CI: axe runs on every page in the light and dark themes, on desktop and on " +
        "a phone, and any violation fails the pull request.",
      featured: null,
      sourceSlug: "portfolio-brief",
    },
    {
      body:
        "Set a security baseline: a Content Security Policy, HSTS preload, a read-only database role, CI " +
        "actions pinned to a commit, CodeQL, Dependabot and secret scanning.",
      featured: null,
      sourceSlug: "portfolio-brief",
    },
    {
      body:
        "Built it spec-driven with Claude Code: I specify each step, the agent implements and checks it, and " +
        "since the first deploy I review and merge every change through a pull request with CI and a preview " +
        "deployment.",
      featured: null,
      sourceSlug: "portfolio-brief",
    },
  ],
  skills: [
    { skillSlug: "typescript", contextNote: null, sourceSlug: "portfolio-brief" },
    {
      skillSlug: "react",
      contextNote: "Server Components, through the Next.js App Router",
      sourceSlug: "portfolio-brief",
    },
    { skillSlug: "spec-driven-development", contextNote: null, sourceSlug: "portfolio-brief" },
    { skillSlug: "claude-code", contextNote: null, sourceSlug: "portfolio-brief" },
    { skillSlug: "ai-driven-development", contextNote: null, sourceSlug: "portfolio-brief" },
    {
      skillSlug: "postgresql",
      contextNote: "Neon, through Drizzle",
      sourceSlug: "portfolio-brief",
    },
    { skillSlug: "zod", contextNote: null, sourceSlug: "portfolio-brief" },
    { skillSlug: "vitest", contextNote: null, sourceSlug: "portfolio-brief" },
    {
      skillSlug: "e2e",
      contextNote: "axe on every page, desktop and phone, light and dark",
      sourceSlug: "portfolio-brief",
    },
    {
      skillSlug: "ci-cd",
      contextNote: "GitHub Actions, with a throwaway Postgres",
      sourceSlug: "portfolio-brief",
    },
    { skillSlug: "git", contextNote: null, sourceSlug: "portfolio-brief" },
    { skillSlug: "nodejs", contextNote: null, sourceSlug: "portfolio-brief" },
    { skillSlug: "responsive-web-design", contextNote: null, sourceSlug: "portfolio-brief" },
    {
      skillSlug: "nextjs",
      contextNote: "App Router with Server Components, prerendered from the database at build",
      sourceSlug: "portfolio-brief",
    },
    {
      skillSlug: "tailwind-css",
      contextNote: "OKLCH colour tokens in both themes, container queries",
      sourceSlug: "portfolio-brief",
    },
    {
      skillSlug: "wcag",
      contextNote: "WCAG 2.2 AA enforced in CI with axe on every page",
      sourceSlug: "portfolio-brief",
    },
    {
      skillSlug: "turborepo",
      contextNote: "Task caching in a monorepo of layered packages",
      sourceSlug: "portfolio-brief",
    },
    {
      skillSlug: "playwright",
      contextNote: "End-to-end tests on every page, desktop and phone, light and dark",
      sourceSlug: "portfolio-brief",
    },
    {
      skillSlug: "vercel",
      contextNote: "A protected preview on every pull request; production on merge",
      sourceSlug: "portfolio-brief",
    },
  ],
  sourceSlug: "portfolio-brief",
} satisfies Project;
