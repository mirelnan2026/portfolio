# 0005. Security baseline, and a Content Security Policy for a prerendered page

- Status: Accepted
- Date: 2026-11-14

## Context

The site is public, prerendered at build from Postgres and served from a CDN; later stages add an AI chat and
a job-match form that take untrusted text. The baseline follows the OWASP Top 10 and the OWASP Top 10 for LLM
Applications. Most of it was put in place step by step (headers at 4j, the read-only database role at 3b,
supply chain and repository rules at 6); the open question was the Content Security Policy.

The page carries 47 inline scripts in its prerendered HTML: the theme script of next-themes (it sets the
`dark` class before the first paint), the React Server Components payload (`self.__next_f.push(…)`) and the
scripts that resolve Suspense boundaries. Their content changes with every build. A strict policy needs each
inline script allowed by a nonce or a hash: a nonce is per request, so Next.js can only add it when the page is
rendered per request, and the headers in `next.config.ts` are fixed before the build, so they cannot hold the
hashes of scripts the build produces.

## Decision

- **Headers on every response** (`apps/web/src/lib/security-headers.ts`, tested): HSTS for two years with
  `includeSubDomains; preload`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`,
  a `Permissions-Policy` that turns off camera, microphone and geolocation, `X-Frame-Options: DENY`, no
  `X-Powered-By`, and `X-Robots-Tag: noindex` off production.
- **Content Security Policy that keeps the page static:** `default-src 'self'`; scripts, styles, fonts, images and
  connections from this origin only; `script-src` and `style-src` also allow `'unsafe-inline'`; `frame-src 'none'`,
  `frame-ancestors 'none'`, `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`; `upgrade-insecure-requests`
  on production. `'unsafe-eval'` only under `next dev`, which React needs there. Off production, the sources of the
  Vercel toolbar (`vercel.live` and the hosts it loads) are added, so previews keep their comments toolbar.
- **The JSON-LD script is a data block** (`type="application/ld+json"`), which the policy does not govern; its
  safety comes from escaping `<` (ADR 0007).
- **Data and secrets:** the app reads Postgres as a role that can only `SELECT` (ADR 0003, step 3b); secrets live
  only in `.env.local` and as Sensitive variables on Vercel, are validated at startup and never echoed in errors.
- **Supply chain and repository:** frozen lockfile in CI, `pnpm audit`, a 7-day minimum release age in pnpm and
  Dependabot, install scripts blocked unless allowed, actions pinned to a commit, CodeQL, secret scanning with push
  protection, a ruleset on `main`, private vulnerability reporting (`SECURITY.md`, `/.well-known/security.txt`).

## Consequences

- The page stays prerendered and served from the CDN: no database query and no server render per visit.
- The policy still stops what matters on this page: scripts, styles, fonts and connections from other origins,
  framing, plugins, form posts elsewhere and mixed content. It does not stop an inline script injected into the
  HTML. That risk is low here: no user input is rendered as HTML, React escapes text, and the only raw HTML is our
  own escaped JSON-LD.
- Mozilla Observatory scores the policy below A+ because of `'unsafe-inline'`.
- When the chat and job match render model output (stages 1–2), it is rendered as text or sanitized Markdown, never
  as HTML. Their API routes return data, not documents, so a stricter policy can be set on any dynamic page they add.

## Alternatives considered

- **A nonce per request:** a strict policy and an A+ score, but every page rendered per request, with no static shell
  and no CDN cache: the opposite of the architecture, for a page without user input.
- **Hashes computed after the build:** strict and static, but it needs a post-build step that reads Next.js's output
  and rewrites the headers on Vercel, tied to internals that change between releases.
- **Next.js experimental Subresource Integrity:** adds `integrity` to the script files only; the inline scripts would
  still need `'unsafe-inline'`.
