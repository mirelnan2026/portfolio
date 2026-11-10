import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import jsxA11y from "eslint-plugin-jsx-a11y";
import { defineConfig, globalIgnores } from "eslint/config";
import base from "./base.js";

/**
 * Config for the Next.js app: our TypeScript base, Next's rules (React, hooks, imports, Core Web Vitals)
 * and the strict accessibility preset, whose errors block the commit and CI.
 */
export default defineConfig(
  nextCoreWebVitals,
  base,
  {
    // eslint-config-next registers the jsx-a11y plugin but only turns on a few rules, as warnings.
    rules: jsxA11y.flatConfigs.strict.rules,
  },
  {
    // Apps are inbound adapters: they reach the database only through @mirelnan/db's repositories.
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["drizzle-orm", "drizzle-orm/*", "pg"],
              message:
                "Apps read data through the repositories from @mirelnan/db, never the driver.",
            },
            {
              group: ["@mirelnan/cv-data"],
              message: "cv-data is the seed's input; the app reads the database.",
            },
          ],
        },
      ],
    },
  },
  globalIgnores([".next/**", "next-env.d.ts"]),
);
