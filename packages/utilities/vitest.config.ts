import { defineConfig } from "vitest/config"

// Bound the worker pool explicitly. The full rationale is in
// `packages/react/vitest.config.ts`: turbo runs several packages' test tasks at
// once, each runner defaults to roughly one worker per core, and the ceiling
// that matters is tasks × workers. Two workers keeps this suite parallel without
// oversubscribing a loaded machine.
export default defineConfig({
  test: {
    maxWorkers: 2,
  },
})
