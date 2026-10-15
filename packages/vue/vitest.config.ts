import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test-setup.ts"],
    include: ["src/**/*.test.ts"],
    // Bound the worker pool explicitly, for the same reason as `packages/react`
    // (see the comment there): turbo runs several packages' test tasks at once
    // and each is itself a runner that opens a worker per core, so the ceiling
    // that matters is tasks × workers. Two workers keeps this suite parallel
    // without oversubscribing a loaded machine.
    maxWorkers: 2,
  },
})
