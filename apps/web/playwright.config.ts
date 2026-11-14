import { defineConfig, devices } from "@playwright/test";

const port = 3100;

/**
 * End-to-end tests against the production build (`next build` first): the same HTML, headers and scripts that
 * Vercel serves. Two projects, a desktop and a phone, so every check runs at both sizes.
 */
export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  use: { baseURL: `http://localhost:${String(port)}`, trace: "retain-on-failure" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "phone", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: `pnpm exec next start --port ${String(port)}`,
    url: `http://localhost:${String(port)}`,
    reuseExistingServer: !process.env.CI,
  },
});
