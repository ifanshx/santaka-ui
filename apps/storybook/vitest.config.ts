import { defineConfig } from "vitest/config"
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin"
import { playwright } from "@vitest/browser-playwright"
import { fileURLToPath } from "node:url"

/**
 * Runs the `play` functions attached to stories as real tests (docs/ARCHITECTURE.md section
 * 10, "controls and interaction tests for interactive components").
 *
 * Two deliberate choices:
 *
 * - The browser is Chromium through `@vitest/browser-playwright`, the same
 *   engine the rest of the repo's browser tests use. Interaction tests that
 *   assert on focus order, `aria-*` state, and custom events only mean something
 *   in a browser that implements them.
 * - The `play` functions live in the story files themselves, not in a parallel
 *   test suite. A test that describes a component the workshop does not render
 *   can drift from the story a reviewer actually looks at.
 */
const dirname = fileURLToPath(new URL(".", import.meta.url))

export default defineConfig({
  plugins: [storybookTest({ configDir: `${dirname}.storybook` })],
  test: {
    name: "storybook",
    // Each worker is a Chromium instance, so an unbounded pool is the heaviest
    // thing in `verify`. Bound it the same way as the other suites (see
    // `packages/react/vitest.config.ts`).
    maxWorkers: 2,
    browser: {
      enabled: true,
      headless: true,
      provider: playwright(),
      instances: [{ browser: "chromium" }],
    },
  },
})
