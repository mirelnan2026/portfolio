import { configDefaults, defineConfig } from "vitest/config";

// The name labels this package in test output and in the GitHub Actions job summary. The Playwright specs in e2e/
// run in a browser against a build (`pnpm test:e2e`), not in Vitest.
export default defineConfig({
  test: { name: "web", exclude: [...configDefaults.exclude, "e2e/**"] },
});
