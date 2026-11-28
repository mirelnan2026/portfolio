# 0014. Server errors are reported to Sentry, with no visitor data

- Status: Accepted
- Date: 2026-11-28

## Context

The chat is the first part of the site that fails at run time: the model times out, refuses, answers with nothing,
or a tool throws. `runChatTurn` turns every such failure into a generic line for the visitor and writes the cause to
the server log with `console.error`; the handler writes one `chat_turn` line per question. Those lines exist only in
Vercel's runtime logs, which are short-lived, not grouped and not alerted on: a failure that starts at night is found,
if at all, by reading logs by hand, and a repeated one looks like many unrelated lines.

The site has rules that any monitoring tool must respect: no tracking and no third-party scripts without a reason
(the privacy rule), a CSP that allows only this origin (ADR 0005), no question, answer or visitor address in any log
(ADR 0012), no spending that a visitor can trigger, and the AI's secrets kept on the server.

## Decision

- **Sentry, on the free Developer plan, in the EU data region (Frankfurt),** next to Neon and the Vercel functions.
  One organization, one project for `apps/web`; the MCP server gets its own project when it is deployed.
- **Server side only.** `@sentry/nextjs` is initialised in `instrumentation.ts` for the Node.js runtime, and its
  `onRequestError` reports errors that escape a route or a render. **No browser SDK**: the page ships no monitoring
  code, the CSP keeps `connect-src 'self'`, and there is no public endpoint through which anyone could fill the
  monthly quota. A browser SDK needs its own decision (tunnel route, its own rate limit, CSP).
- **Handled failures are reported explicitly.** The chat catches its errors, so `onRequestError` never sees them.
  The handler takes a `reportError(error, context)` dependency, injected like the clock and tested with a fake; the
  route wires it to `Sentry.captureException`. The context holds only what the `chat_turn` line holds (`steps`,
  `tools`, `durationMs`, the failure kind), never the question, the answer, the conversation or the visitor's address.
  A cancelled request (the visitor left) is not reported.
- **No visitor data leaves the server:** `sendDefaultPii: false`, and a `beforeSend` that removes the request body,
  headers, cookies, query string and user from every event, tested as a pure function. Errors only: no performance
  tracing (`tracesSampleRate: 0`), no Session Replay, no profiling.
- **`SENTRY_DSN` is read when the server starts, never at build, and is optional:** without it Sentry stays off, so
  CI, local runs and builds send nothing and need no Sentry variable. Set on Vercel for Production and Preview, with
  the environment taken from `VERCEL_ENV`. The DSN is not a secret (it only allows sending events), but it is never a
  `NEXT_PUBLIC_` variable, since no browser code uses it.
- **No source map upload at first:** it would need `SENTRY_AUTH_TOKEN` at build, a write secret in the build. Server
  stack traces are readable enough to start; revisit if they are not.
- **Alerts by email** on a new issue and on a spike. The quota (5,000 errors a month on the free plan) is a cap, not a
  bill: the account has no payment method, so running out drops events, and the server log still has every line.
- `console.error` and the `chat_turn` line stay: Sentry is the alert and the grouping, the log is the full record.

## Alternatives considered

- **Datadog.** Its free tier covers infrastructure metrics, not error tracking, log management or APM, which are
  billed per host or per volume. More than a one-person site needs, at a cost the free tier does not cover.
- **Vercel's runtime logs alone.** No grouping, no alerts, short retention on the plans this site uses.
- **A log drain to a log platform** (Axiom, Better Stack). Keeps every line, but finding and alerting on errors is
  queries to write; Sentry groups errors into issues out of the box. A drain can be added later for the `chat_turn`
  lines if they are worth keeping.
- **Sentry in the browser too.** Would catch client errors, but ships SDK code to every visitor, needs the CSP opened
  or a tunnel route, and gives anyone a way to burn the quota. The chat's browser code already turns every failure
  into a handled message.
- **Self-hosted Sentry or GlitchTip.** No vendor, but a server to run and patch for a portfolio site.

## Consequences

- (+) A chat failure becomes an issue with a count and an email, grouped by cause, without anyone reading logs.
- (+) Nothing changes for visitors: no script, no cookie, no new origin in the CSP, no personal data sent.
- (+) Tests and CI never talk to Sentry: the reporter is injected, and Sentry is off without its DSN.
- (−) A new third-party processor of server errors, which must be listed in the runbook's platforms and kept free of
  visitor data by `beforeSend`; a careless `captureException` with a question in its message would bypass the rule,
  so code review checks every call site.
- (−) Client-side errors are not monitored.
- (−) One more dependency that releases often, pinned exact and subject to the 7-day release age.
