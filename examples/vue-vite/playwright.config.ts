import { defineConfig, devices } from "@playwright/test"

/**
 * Playwright configuration for the Vue example.
 *
 * One project, Chromium only, and that is the honest scope: this example exists
 * to prove that the Vue adapter's form controls submit through a plain form,
 * which is a behavior claim about the adapter, not a browser-support claim. The
 * browser-support claim lives in the universal package's suite, which runs on
 * all three engines (ADR-014) — running this on three would triple the cost to
 * re-prove something it does not test.
 *
 * The app is served from its **built** output, not the dev server. A dev server
 * would resolve modules differently from a consumer's production build, and the
 * point of this example is to exercise the same resolution path a consumer gets.
 */
export default defineConfig({
  testDir: "e2e",
  testMatch: "**/*.e2e.ts",
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "line" : "list",
  use: {
    baseURL: "http://127.0.0.1:4175",
    trace: "on-first-retry",
  },
  webServer: {
    command: "pnpm run preview",
    url: "http://127.0.0.1:4175",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
})
