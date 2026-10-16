import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    include: ["scripts/**/*.test.ts"],
    // Bound the worker pool explicitly; see `packages/react/vitest.config.ts`.
    maxWorkers: 2,
  },
})
