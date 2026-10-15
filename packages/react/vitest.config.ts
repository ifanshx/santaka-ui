import react from "@vitejs/plugin-react"
import { defineConfig } from "vitest/config"

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test-setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    // Bound the worker pool explicitly.
    //
    // Vitest's forks pool defaults to roughly one worker per core, and turbo runs
    // several packages' test tasks at once — so eight packages each opening a
    // six-worker pool on a six-core machine is dozens of processes competing for
    // the same cores. The symptom was `[vitest-pool]: Failed to start forks worker …
    // Timeout waiting for worker to respond`, in whichever package lost the race,
    // which read as `pnpm run verify` failing on a package nobody had touched.
    //
    // Bounding turbo's task concurrency (turbo.json, "50%") reduced but did not
    // remove it, because the two multiply: the real ceiling is tasks × workers.
    // Two workers here keeps the tests parallel without oversubscribing, and it is
    // stated rather than left to a default that depends on the machine.
    poolOptions: {
      forks: {
        maxForks: 2,
        minForks: 1,
      },
    },
  },
})
