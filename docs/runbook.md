# Runbook

How to operate the site: deploying, changing data, rotating credentials and recovering from a bad release.
It assumes the setup described in the README: Vercel for hosting, Neon for Postgres, Upstash for Redis (rate
limiting), GitHub for code and CI.

## Platforms

Every service the site depends on. Secrets are never written here, only the names of the variables they become.

| Platform                     | Used for                                     | Secrets → where they go                                                                                                     |
| ---------------------------- | -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| GitHub                       | repository, CI, Dependabot, secret scanning  | none                                                                                                                        |
| Vercel                       | hosting, previews, Web Analytics             | none (holds the variables below)                                                                                            |
| Neon                         | Postgres: the CV data                        | owner URL → `packages/db/.env.local` (`DATABASE_ADMIN_URL`); reader URL → `apps/web/.env.local` and Vercel (`DATABASE_URL`) |
| Upstash                      | Redis: the rate-limit counters               | REST URL and token → `apps/web/.env.local` and Vercel (`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`)                |
| Anthropic                    | Claude API: the chat                         | API key → `apps/web/.env.local` and Vercel (`ANTHROPIC_API_KEY`); spend limit set in the console                            |
| Registrar                    | the domain `mirelnan.dev` and its DNS        | none                                                                                                                        |
| Google Search Console / Bing | indexing (Bing imported from Search Console) | none; verified by a DNS `TXT` record that must stay                                                                         |
| Sentry (planned, ADR 0014)   | server error alerts (EU region, free plan)   | project DSN → Vercel (`SENTRY_DSN`, Production and Preview); not needed locally or in CI                                    |

Vercel variables are **Sensitive**, for Production **and** Preview. No store is connected through a Vercel
integration: each variable is set by hand.

## Deploying a change

Every change reaches production through a pull request:

```bash
git switch main && git pull
git switch -c feat/<what>      # or fix/<what>
# … commit, push: each push runs CI and builds a protected Vercel preview
```

1. Open a pull request into `main`.
2. Check the preview (it needs a Vercel login) and wait for the required checks: `Lint, typecheck, test, build`
   and `Vercel`.
3. **Squash and merge.** The merge deploys to production in about a minute. Nothing can be pushed to `main`
   directly (a ruleset protects it).

## Changing the database

Order on every deploy that touches data: **migrate → seed → build**, because the page is prerendered from the
database at build time.

- **New content** (a skill, an experience, a product): follow [`packages/cv-data/README.md`](../packages/cv-data/README.md),
  then run `pnpm --filter @mirelnan/db db:seed` against Neon **before** merging. The new data appears on the site
  with the next production build.
- **A schema change:** generate the migration (`pnpm --filter @mirelnan/db db:generate --name <name>`), review the
  SQL, run `db:migrate` then `db:seed` against Neon, then merge. A new `NOT NULL` column on a table with rows needs
  two migrations (add it with a default, then drop the default), as described in `CLAUDE.md` (Conventions).
- Migrations only move forward and are additive whenever possible, so the code already in production keeps
  working while the next build runs.

## Rotating the read-only database password

The app connects as the read-only role `portfolio_reader`.

1. `pnpm --filter @mirelnan/db db:reader` — sets a new password and writes the new URL to
   `packages/db/.env.reader.local` (git-ignored). The old password stops working immediately.
2. Turn the URL into the pooled host (insert `-pooler` after the endpoint id) and put it in
   `apps/web/.env.local`.
3. In Vercel, replace `DATABASE_URL` (a **Sensitive** variable, for Production **and** Preview), then redeploy
   production.
4. Delete `packages/db/.env.reader.local`.

The live site keeps working meanwhile: it is static, so only new builds need the new URL.

## Rotating the Upstash token

1. Upstash console → the database → reset its credentials. The old token stops working immediately.
2. Copy the new REST URL and token (the standard token, not the read-only one) into `apps/web/.env.local`.
3. In Vercel, replace `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` (**Sensitive**, Production **and**
   Preview), then redeploy production.

Unlike the database password, this affects the live site: the API routes read the token at request time, so
between steps 1 and 3 they answer 500. The pages are static and keep working.

## Rotating the Anthropic API key

Two workspaces in the Anthropic Console, each with its own monthly spend limit, so tests can never use up the live
site's budget; the Default workspace (course work, never used by the site) has one too, and the organization's limit
covers the three. The amounts are kept out of the repository, because a public figure would tell an attacker how much
spending takes the chat offline: they are in the owner's password manager, next to the keys. Each workspace holds one
key; the chat and job match share it.

| Workspace              | Key                    | Used by                           |
| ---------------------- | ---------------------- | --------------------------------- |
| `portfolio-production` | `portfolio-production` | Vercel Production                 |
| `portfolio-dev`        | `portfolio-dev`        | Vercel Preview, local runs, evals |

1. Console → the workspace → API keys → Create key, with the workspace as its Scope. Expiry: one year for production,
   rotated with the other yearly tasks (an expired key takes the chat down without warning), 3 months for dev; note
   both dates in the password manager.
2. Put the dev key in `apps/web/.env.local`. In Vercel, delete and re-add `ANTHROPIC_API_KEY` (**Sensitive**): the
   production key for Production, the dev key for Preview. Redeploy production.
3. Delete the old key in the Console once the new deployment answers.

When a workspace reaches its limit, the API refuses requests and the chat shows its generic "unavailable" line until
the next month or a higher limit: it fails closed, never at a cost.

## Rotating the chat signing key

1. Generate a key without printing it (once per environment: Production, Preview and local get different keys):

   ```bash
   node -e "process.stdout.write(require('node:crypto').randomBytes(32).toString('base64url'))" > /tmp/key && chmod 600 /tmp/key
   ```

2. Local: put it in `apps/web/.env.local` as `CHAT_SIGNING_KEY`. Vercel: delete and re-add `CHAT_SIGNING_KEY`
   (**Sensitive**), one value for Production and another for Preview, then redeploy production. Delete `/tmp/key`.

Every open conversation loses its history: the old signatures no longer verify, so the server drops those turns and
the visitor starts again. Nothing is stored, so nothing else needs cleaning up. Rotate at once if the key may have
leaked.

## Feature flags

A feature that is not launched is hidden by a build-time flag, `<FEATURE>_ENABLED`, on only when it is exactly
`true` ([ADR 0013](adr/0013-build-time-feature-flags.md)). It is read at build, not at request: the page is
prerendered, so a change takes effect with the next deploy.

**Adding a flag** (in the feature's pull request):

1. `apps/web/next.config.ts` → `env`: `<FEATURE>_ENABLED: process.env.<FEATURE>_ENABLED ?? ""`.
2. In the module that imports the feature, compare inline: `process.env.<FEATURE>_ENABLED === "true" ? … : null`,
   with a comment saying why it is not a helper.
3. Declare it in `turbo.json` `build.env`, in the CI job's `env` in `ci.yml` (`"true"`, so the e2e tests reach it)
   and in `apps/web/.env.example` (empty).
4. On Vercel, add it for **Preview** only, as a plain variable (it is not a secret).
5. Build with the flag off and search for a text unique to the feature: it must be in neither
   `apps/web/.next/server/app/index.html` nor `apps/web/.next/static`.

**Launching:** add the variable for **Production** and redeploy production. **Hiding it again** (an incident): remove
the Production variable and redeploy. **Once the feature stays:** remove the flag, its comparison and its
declarations in a pull request.

### The chat (`CHAT_ENABLED`)

The "Ask about me" panel is built only when `CHAT_ENABLED` is exactly `true`.

- **Before launch:** on Vercel, `CHAT_ENABLED` = `true` for **Preview** only. It is not a secret, so it can be a plain
  variable. CI sets it in `ci.yml`, so the e2e and axe tests can open the panel against a faked `/api/chat`.
- **At launch:** add it for **Production** and redeploy production.
- **To hide the chat again** (an incident, a model problem): remove the Production variable and redeploy. The route
  `/api/chat` stays deployed either way; the variable only decides whether the page links to it.
- Locally: `CHAT_ENABLED=true` in `apps/web/.env.local`, or on the command line
  (`CHAT_ENABLED=true pnpm --filter @mirelnan/web build`, or `dev`), shows the panel. A variable set on the command
  line wins over `.env.local`, so `CHAT_ENABLED=false pnpm --filter @mirelnan/web build` builds the page as
  production sees it before launch.
- **Check that the chat is really out:** after that `false` build, `grep -rl "Your question" apps/web/.next/static`
  finds nothing. The HTML hiding the button is not enough: the panel's JavaScript must not be in the page either.

## Rolling back

- **Bad release:** Vercel → Deployments → the last good production deployment → **Instant Rollback**. Then fix
  forward with a pull request.
- **Bad data:** the data is rebuilt from `cv-data` by the seed, so revert the change in a pull request, seed, and
  redeploy. Neon can also restore the database to an earlier point in time.
- **A migration that failed on Neon:** it runs in a transaction, so nothing was applied. Fix the migration in a
  pull request; never edit an applied migration, add a new one.

## Dependencies

- Dependabot opens pull requests every Monday: one grouped pull request for minor and patch updates, one per major
  version. Read the changelogs, check the preview, then squash and merge.
- pnpm refuses any version younger than 7 days (`minimumReleaseAge`). A temporary exception is an exact version
  with a dated comment in `pnpm-workspace.yaml`: remove it on that date.
- TypeScript stays on 6.x until the tools that need its JavaScript API support 7 (see `.github/dependabot.yml`).

## Yearly

- **`security.txt`** expires a year after it was written. A test fails 30 days before the date: set a new
  `Expires` in `apps/web/public/.well-known/security.txt`.
- **Anthropic API key:** rotate the `portfolio-production` key before it expires (see "Rotating the Anthropic API key").
- **Domain:** `mirelnan.dev` renews automatically at the registrar; the TLS certificates renew automatically on
  Vercel. Keep the DNS records (`A`, `CNAME www`, and the search console `TXT` records).
