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
  // Visual-regression defaults (ADR-019). Screenshots are the only test whose
  // result depends on fonts, so the tolerance and the baseline environment are
  // stated rather than left to defaults: 1% of pixels may differ (antialiasing
  // and subpixel text rendering differ between machines), animations are
  // disabled, and the caret is hidden.
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.01,
      animations: "disabled",
      caret: "hide",
      scale: "css",
    },
  },
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
    {
      // Visual regression is its own project (ADR-019): it runs from the
      // `test:visual` script, not from `test`, because a screenshot diff needs
      // a stable rendering environment and a reviewer, not a red build on
      // every font hinting difference. Off the flag it is ignored entirely, so
      // `pnpm run test` and `verify` never depend on a baseline image.
      name: "visual",
      testMatch: "**/*.visual.ts",
      ...(process.env.SK_VISUAL ? {} : { testIgnore: /.*/ }),
      // A fixed viewport and scale factor are prerequisites for a stable
      // baseline; the baseline environment itself is the pinned Playwright
      // Docker image, documented in ADR-019.
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1000, height: 900 },
        deviceScaleFactor: 1,
      },
      // Snapshots live beside the spec, in a directory named for the project.
      snapshotPathTemplate: "{testDir}/{testFilePath}-snapshots/{arg}-{projectName}{ext}",
    },
  ],
})
