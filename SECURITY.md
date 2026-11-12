# Security policy

## Scope

The site at [mirelnan.dev](https://mirelnan.dev) and the code in this repository. Only the current `main` branch,
which is what runs in production, is supported.

## Reporting a vulnerability

Please report privately, never in a public issue or pull request:

- **Preferred:** [open a private security advisory](https://github.com/mirelnan2026/portfolio/security/advisories/new)
  on this repository (GitHub private vulnerability reporting).
- **Or by email:** [nan.mirel@gmail.com](mailto:nan.mirel@gmail.com).

Include what you found, the steps to reproduce it, and the impact you expect. You will get an answer within
7 days. A confirmed issue is fixed as a priority and credited to you in the advisory, unless you prefer otherwise.

The same contacts are published at
[`/.well-known/security.txt`](https://mirelnan.dev/.well-known/security.txt) (RFC 9116).

## Good-faith research

Testing is welcome when it stays within these limits:

- no denial of service, no automated scanning that loads the site heavily;
- no attempts to access data or accounts other than your own, and no social engineering;
- give a reasonable time to fix an issue before you disclose it.

## Out of scope

- The platforms the site runs on (Vercel, Neon, GitHub): report issues in them to those vendors.
- Protections that the README lists as planned (🚧), until they are released.
- Findings without a security impact, such as version disclosure or missing best-practice headers on
  third-party domains.

## What is already in place

The baseline (HTTP security headers, read-only database role, secret scanning, CodeQL, Dependabot, SHA-pinned CI
actions, a release-age rule for dependencies) is described in the [README](README.md#quality-bars).
