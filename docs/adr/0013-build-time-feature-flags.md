# 0013. Unreleased features are hidden by build-time flags

- Status: Accepted
- Date: 2026-11-28

## Context

The home page is prerendered at build and served from the CDN. The chat ("Ask about me") and later job match are
built step by step: their routes can be deployed and tested on previews long before they are launched, but until then
nothing on the production page may mention them or link to them.

The first version hid the chat's button with a helper, `isChatEnabled()`, called in the root layout:
`isChatEnabled() ? <ChatPanel /> : null`. The production build had no button in its HTML, but a review of
`.next/static` found the panel's JavaScript in a chunk that `index.html` loads. A static import of a `"use client"`
module from a Server Component becomes a client reference when the bundler builds the module graph, before the
condition runs at prerender. The condition hid the markup, not the code.

Five variants were built with the flag off and the bundle searched for the panel's text: a dynamic `import()` in an
async Server Component, a helper function, a constant exported from another module, a comparison in the layout
without inlining, and a comparison in the layout with the value inlined by `next.config.ts`. Only the last one left
no chat code in the page.

## Decision

- **A feature that is not launched is hidden by a build-time flag** named `<FEATURE>_ENABLED` (`CHAT_ENABLED`), on
  only for exactly `"true"`, so a typo or another value keeps the feature hidden.
- **The value is inlined at compile time:** `env: { <FEATURE>_ENABLED: process.env.<FEATURE>_ENABLED ?? "" }` in
  `apps/web/next.config.ts`. A build without the variable compiles `process.env.<FEATURE>_ENABLED === "true"` to
  `"" === "true"`.
- **The comparison is written in the module that imports the feature,** never in a helper or an exported constant:
  the bundler folds the constant, removes the dead branch, and then the unused import, so no chunk is emitted. A
  comment next to it says why, so a later refactor does not move it.
- **The flag is declared everywhere a build reads it:** `turbo.json` `build.env` (strict env mode drops undeclared
  variables, and the value splits the cache), the CI job's `env` (so the e2e and axe tests build and open the feature),
  Vercel **Preview** as a plain variable, and the app's `.env.example`, empty.
- **Verified by a build with the flag off:** a text unique to the feature is absent from both the HTML and
  `.next/static`. The HTML check alone is not enough.
- **At launch,** the flag is added for Production and the site redeployed. Once the feature is there to stay, the flag
  and its declarations are removed in a pull request, so no dead switch remains.
- **A flag only decides what the page shows.** Routes behind it (`/api/chat`) stay deployed, protected by their own
  rate limits and validation, not by being unlinked.

## Alternatives considered

- **Hide with CSS** (`hidden` on the button). The markup and the JavaScript ship to every visitor, and anyone can
  show the feature from the developer tools.
- **A helper (`isChatEnabled()`) or a constant from another module.** Reads well and is easy to test, but tried: it
  hides only the HTML, because the bundler does not carry the constant across modules before it decides which client
  components the page needs.
- **A dynamic `import()` inside an async Server Component.** Tried: the chunk is still emitted and loaded.
- **Runtime flags** (Vercel Flags SDK, Edge Config, a cookie). A flag can change without a deploy and can target
  visitors, but reading it per request makes the page dynamic or ships the code to every visitor and decides in the
  browser. The site has one owner and a launch is a deploy anyway.
- **`NEXT_PUBLIC_<FEATURE>_ENABLED`.** Next inlines `NEXT_PUBLIC_` variables in client code; whether it also folds
  them in a Server Component's module graph was not tested, and the name would suggest a value meant for the browser.

## Consequences

- (+) A production build without the flag ships none of the feature's HTML or JavaScript: no extra bytes, nothing to
  find in the page.
- (+) The page stays fully static; the flag costs nothing at request time.
- (+) Previews and CI run the feature end to end before launch.
- (−) Changing a flag needs a new deploy.
- (−) The rule "compare in the importing module" is easy to break with an obvious refactor, and nothing fails at
  build when it is broken: the comment and the `.next/static` check are the guard.
- (−) Each flag is declared in five places (`next.config.ts`, `turbo.json`, CI, Vercel, `.env.example`); a missing
  one hides the feature where it was expected, which the e2e tests catch in CI.
