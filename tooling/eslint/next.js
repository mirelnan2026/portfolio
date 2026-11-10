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
  globalIgnores([".next/**", "next-env.d.ts"]),
);
