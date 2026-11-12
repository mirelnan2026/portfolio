# Runbook

How to operate the site: deploying, changing data, rotating credentials and recovering from a bad release.
It assumes the setup described in the README: Vercel for hosting, Neon for Postgres, GitHub for code and CI.

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
- **Domain:** `mirelnan.dev` renews automatically at the registrar; the TLS certificates renew automatically on
  Vercel. Keep the DNS records (`A`, `CNAME www`, and the search console `TXT` records).
