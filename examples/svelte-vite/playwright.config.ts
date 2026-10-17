import { defineConfig, devices } from "@playwright/test"

/**
 * Playwright configuration for the Svelte example.
 *
 * One project, Chromium only, and that is the honest scope: this example proves
 * that Svelte's server render and hydration work with the custom elements, and
 * that the form controls submit through a plain form. Those are claims about the
 * framework path, not browser-support claims; the browser-support claim lives in
 * the universal package's suite, which runs on all three engines (ADR-014).
 *
 * The app is served from its **built** output by `server.mjs`, not from the dev
 * server. A dev server would compile the Svelte components differently and serve
 * unbundled modules, so the hydration this file tests would not be the hydration
 * a consumer gets.
 */
export default defineConfig({
  testDir: "e2e",
  testMatch: "**/*.e2e.ts",
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "line" : "list",
  // One worker: this suite is a handful of tests, and a single browser keeps it
  // from competing with the larger suites turbo runs alongside it (see
  // `packages/react/vitest.config.ts`).
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:4176",
    trace: "on-first-retry",
  },
  webServer: {
    command: "node server.mjs",
    url: "http://127.0.0.1:4176",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
})
