# 0004. Accessibility: WCAG 2.2 AA, enforced by tooling

- Status: Accepted
- Date: 2026-11-14

## Context

The portfolio is itself evidence of frontend seniority, and accessibility is part of that work. A promise in a
README proves nothing; a regression added by any later change must fail the build, in both themes and at both
desktop and phone sizes, the way a type error does.

## Decision

- **Target: WCAG 2.2 level AA**, in the light and the dark theme, from 320px wide to large screens.
- **Enforced at four levels:**
  - **Lint:** `eslint-plugin-jsx-a11y` (strict) in the `next` ESLint preset, on every commit (lefthook) and in CI.
  - **Unit test:** `theme-contrast.test.ts` computes the contrast of every colour pair the design uses, in both
    themes (4.5:1 for text, 3:1 for focus outlines and input borders), from the tokens in `globals.css`.
  - **End-to-end:** Playwright runs `@axe-core/playwright` with the WCAG 2.0, 2.1 and 2.2 A and AA rules on every
    page, plus states that reveal hidden content (a selected skill), in light and dark, as a desktop and as a phone,
    against the production build in CI. Any violation fails the run, and with it the pull request.
  - **Review:** keyboard-only use, visible focus, reduced motion and high contrast are checked when a component is
    added; the rules are in `CLAUDE.md`.
- **Built from accessible parts:** semantic HTML first; native `<details>` for disclosures; Base UI primitives (via
  shadcn/ui) for dialogs and menus, with our fixes to their focus styles and touch targets; state shown with
  `aria-pressed` and `aria-current` and never by colour alone.
- **A public accessibility statement** at `/accessibility`: the target, the checks that really run, and how to report
  a barrier. It claims only what the tooling verifies.

## Consequences

- A change that breaks contrast, a name, a role or a target size fails CI before it can be merged.
- axe finds about a third of WCAG issues; the rest (reading order, meaningful text, screen-reader experience) still
  needs people. The statement does not claim more than is checked.
- The end-to-end run adds a browser install and about a minute to CI.

## Alternatives considered

- **Lint and manual checks only:** cheaper, but regressions surface only when someone happens to test.
- **Lighthouse CI:** one score per page, less precise than axe's rule list, and noisy on shared runners; it can be
  added later on the preview deployments.
- **A separate e2e package:** cleaner isolation, but the tests need the web app's build and nothing else, so they
  live next to it in `apps/web/e2e`.
