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
    // stated rather than left to a default that depends on the machine. Every
    // other vitest suite and each Playwright config states the same bound, so the
    // ceiling holds across the whole `verify` run rather than for one package.
    //
    // This is the Vitest 4 spelling. The earlier `poolOptions.forks.maxForks` was
    // removed in Vitest 4 and silently ignored — it emitted a DEPRECATED notice and
    // did nothing, so the bound this comment describes was never actually applied.
    // `minWorkers` has no Vitest 4 equivalent and is gone.
    maxWorkers: 2,
  },
})
