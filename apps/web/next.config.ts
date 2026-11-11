import type { NextConfig } from "next";
import { isProductionDeployment } from "./src/lib/deployment";
import { securityHeaders } from "./src/lib/security-headers";

const nextConfig: NextConfig = {
  // The Next 16 rendering model: a page is prerendered unless it reads request data, and
  // `"use cache"` marks the data that can be cached. Data loading uses it from step 4c.
  cacheComponents: true,
  // Links prefetch one shared static shell per route (recommended with Cache Components).
  partialPrefetching: true,
  // `next dev` would write an AGENTS.md; the agent instructions live in the root CLAUDE.md.
  agentRules: false,
  // No "X-Powered-By: Next.js": it tells an attacker which framework to probe.
  poweredByHeader: false,
  // Next asks for a promise; the list is known at build time.
  headers: () =>
    Promise.resolve([
      { source: "/:path*", headers: securityHeaders({ production: isProductionDeployment() }) },
    ]),
  // Tailwind v4 runs as a Turbopack loader on every CSS file (no PostCSS config needed).
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
