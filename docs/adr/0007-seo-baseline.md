# 0007. SEO baseline: one page, metadata and structured data from the data

- Status: Accepted
- Date: 2026-11-13

## Context

The site is found in two ways: someone searches for the owner's name or for a role and a stack, or
someone shares the link (LinkedIn, Slack, a message). AI search engines read the site too. The
content already lives in Postgres, seeded from `cv-data`, and every visible sentence has a source;
the metadata must follow the same rule, or it can say something the page does not.

## Decision

- **One page, one canonical origin.** `https://mirelnan.dev` (`metadataBase`, `alternates.canonical`);
  `www` and `http://` redirect to it. Pages per case study are added only when one has enough content
  to stand alone. Section anchors come from slugs (`#experience-jwp-connatix`, `#case-study-…`), so
  links keep working if pages are added.
- **Metadata from the data, checked at build.** The title is the name and the current role
  ("Mirel Nan · Senior Frontend Engineer (Angular, React)"), the description the headline's role and
  the intro's sentence that names the stack. `portfolioMetadata` throws above 60 / 160 characters, so
  the build fails instead of a search engine cutting the text.
- **Structured data:** a JSON-LD `ProfilePage` whose `mainEntity` is a `Person` (name, job title,
  description, `sameAs` LinkedIn, address, `knowsAbout` = the top skills plus the profile's broad
  competencies, `alumniOf`), rendered as an inline script with `<` escaped.
- **A share image:** `app/opengraph-image.tsx` draws a 1200×630 card from the profile with `next/og`,
  prerendered at build; its alt text comes from the profile too. Twitter cards use
  `summary_large_image`.
- **`/llms.txt`** for AI search: a route handler that renders the same cached reads as the page as
  Markdown (summary, roles with their highlights and which ones were owned, top skills with years, case
  studies, the workflow, education, languages, contact). Product descriptions are left out: they are
  context, not claims about the owner.
- **Crawling:** `robots.ts` allows every crawler, AI ones included, on production only; previews get
  `Disallow: /` and `X-Robots-Tag: noindex`. `sitemap.ts` lists the page. Google Search Console and
  Bing Webmaster Tools are verified by DNS.

## Consequences

- A change to the CV reaches the title, the description, the share image, the structured data and
  `llms.txt` with the same reseed and deploy as the page: none of them can drift from it.
- Everything is prerendered (`○ /`, `○ /llms.txt`, `● /opengraph-image/card`), so none of it costs a
  request to the database.
- The inline JSON-LD script needs a hash in the Content Security Policy, like the theme script.
- A single page competes for the owner's name, which it wins anyway, but not for long-tail queries
  that separate case-study pages could rank for.

## Alternatives considered

- **A page per section or per case study now:** more URLs to rank, but thin content and duplicated
  text; the gain is mostly sharing a single story, which anchors already allow.
- **Hand-written metadata and a static share image:** simpler, but they would drift from the CV.
- **Microdata or RDFa in the markup instead of JSON-LD:** couples the structured data to the layout;
  JSON-LD is the format Google recommends and keeps both independent.
