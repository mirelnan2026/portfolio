import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // The name labels this package in test output and in the GitHub Actions job summary.
    name: "db",
    // Each test file boots PGlite (Postgres compiled to WebAssembly) and applies every migration in
    // `beforeAll`: about a second on a laptop, over 10s on a two-core CI runner that is also running the
    // other packages' lint, typecheck and tests. Vitest's 10s default is too short for that.
    hookTimeout: 60_000,
    testTimeout: 30_000,
  },
});
