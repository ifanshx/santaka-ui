import { defineConfig, devices } from "@playwright/test"

/**
 * Playwright configuration for the universal package's browser tests
 * (section 12, Test layers: browser tests).
 *
 * Project names mirror the browser support baseline tiers in section 4, so the
 * published support matrix is generated from the projects that actually run
 * rather than hand-maintained. The Firefox and WebKit projects are ignored off
 * CI, where only Chromium is provisioned; CI runs all three.
 */
export default defineConfig({
  testDir: "e2e",
  testMatch: "**/*.e2e.ts",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "line" : "list",
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "on-first-retry",
  },
  webServer: {
    command: "node scripts/serve-examples.mjs",
    url: "http://127.0.0.1:4173/examples/vanilla-html/index.html",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
  projects: [
    { name: "chromium-baseline", use: { ...devices["Desktop Chrome"] } },
    {
      name: "firefox-baseline",
      use: { ...devices["Desktop Firefox"] },
      ...(process.env.CI ? {} : { testIgnore: /.*/ }),
    },
    {
      name: "webkit-baseline",
      use: { ...devices["Desktop Safari"] },
      ...(process.env.CI ? {} : { testIgnore: /.*/ }),
    },
  ],
})
