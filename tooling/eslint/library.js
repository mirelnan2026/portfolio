import { defineConfig } from "eslint/config";
import base from "./base.js";

/**
 * Config for runtime-agnostic library packages (domain, cv-data).
 * They hold pure code: no I/O, no framework, no infrastructure.
 */
export default defineConfig(base, {
  rules: {
    "no-restricted-imports": [
      "error",
      {
        patterns: [
          {
            group: ["@mirelnan/db", "@mirelnan/db/*", "@mirelnan/ai", "@mirelnan/ai/*"],
            message: "Library packages are inner layers: they must not depend on db or ai.",
          },
          {
            group: [
              "drizzle-orm",
              "drizzle-orm/*",
              "@neondatabase/*",
              "@upstash/*",
              "@anthropic-ai/*",
            ],
            message: "Library packages do no I/O: infrastructure clients belong in db or ai.",
          },
          {
            group: ["node:*"],
            message: "Library packages are runtime-agnostic: no Node.js built-in modules.",
          },
          {
            group: ["react", "react-dom", "next", "next/*"],
            message: "Library packages are framework-free: UI code belongs in apps/web.",
          },
        ],
      },
    ],
  },
});
