# 0011. No in-app spending caps for the chat

- Status: Accepted
- Date: 2026-11-27
- Extends: [0005](0005-security-baseline.md)

## Context

Every chat question costs money: up to six model requests, each with the conversation so far. The route is public, so
anyone who finds it can call it. The security baseline asks for a spend limit, and the plan was to add two caps in the
application as well: one per request and one per day, counted in Redis.

The chat already has several limits that bound the cost without counting money:

- per question: at most six model requests and 800 output tokens each, a 20 second timeout per request, and the
  conversation's length capped;
- per visitor: a rate limit per IP, per minute and per day, that refuses the request when Redis does not answer in time;
- for the whole site: a monthly spend limit on the Anthropic Console workspace that holds the production key, with an
  email alert before it is reached, under a separate limit for the organization. A prepaid balance without
  auto-reload sits behind both.

Traffic is expected to be low at launch.

## Decision

- **No spending caps in the application.** The route does not price requests and keeps no money counter.
- **The global cap is the Console's.** The production key lives in its own workspace, whose monthly limit bounds the
  total spend; development and evaluations use another workspace, so they cannot use up the live site's budget.
- **The per-visitor limits stay request-based:** the rate limits per IP, and the per-question limits of the tool loop.
- **Amounts stay out of the repository.** Limits are described by mechanism only, because a public figure tells an
  attacker how much spending takes the chat offline.

## Alternatives considered

- **A cap per request, priced from the token usage.** The per-question limits already bound a request to a few cents;
  pricing every call adds a price table to maintain for each model and fails when prices change.
- **A daily cap in Redis, shared by all visitors.** It reacts within a day instead of within a month, but it is a
  second budget to keep in sync with the Console, another failure mode (closed when Redis is down) and code to test,
  for a site with little traffic. Revisit if traffic grows or the Console alert fires.
- **A global request cap per day, without amounts.** Simpler than a money counter, but it would stop the chat for
  everyone because of one heavy visitor, which the Console limit already does more precisely.

## Consequences

- (+) No pricing code, no second budget, nothing to keep in step with the provider's prices.
- (+) Spending is bounded in one place, outside the application, where a bug in the code cannot raise it.
- (−) A spread-out abuse from many IP addresses can use up the month's budget; the chat is then unavailable until the
  next month or until the limit is raised. It fails closed: the visitor gets the generic "unavailable" line, and no
  money is spent beyond the limit.
- (−) The alert arrives by email, so a reaction depends on the owner reading it.
- Revisit when traffic grows, when the Console alert fires, or before adding a feature that costs more per request
  (job match with long job descriptions).
