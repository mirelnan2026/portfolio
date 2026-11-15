import type { CaseStudy } from "@mirelnan/domain";

export const thisPortfolio = {
  slug: "this-portfolio",
  title: "This portfolio",
  context:
    "A portfolio is evidence of frontend work, so the site itself had to show it: an architecture that can " +
    "grow, accessibility and security that are checked rather than promised, and content that never claims " +
    "more than its sources.",
  approach:
    "A modular monolith in one repository: a pure domain package, a Postgres adapter and a Next.js app that " +
    "reads only through repository interfaces. Every record points to a registered source. Each step was " +
    "specified first, significant choices were recorded as architecture decision records, and since the first " +
    "deploy every change went through a pull request with CI and a preview deployment.",
  outcome:
    "mirelnan.dev went live in November 2026: prerendered from Postgres and served from a CDN, with unit tests " +
    "in every library package and axe checks on every page in both themes, on desktop and on a phone.",
  whatItShows:
    "How I build: decisions written down with their trade-offs, quality enforced by tooling, and an AI agent " +
    "used inside a reviewed, spec-driven workflow.",
  about: { kind: "project", projectSlug: "portfolio" },
  url: "https://github.com/mirelnan2026/portfolio",
  skillSlugs: [
    "typescript",
    "nextjs",
    "react",
    "tailwind-css",
    "wcag",
    "postgresql",
    "spec-driven-development",
    "claude-code",
  ],
  sourceSlug: "portfolio-brief",
} satisfies CaseStudy;
