import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

/**
 * Vite configuration for the React example (plan.md section 10, framework
 * examples; section 17, "Every form control submits through a plain `<form>` in
 * React, Vue, and the universal package").
 *
 * This example exists to close a specific gap rather than to look nice. The
 * React adapter's unit tests run under jsdom, which has no form submission and
 * no form-associated custom element implementation — so they can prove the
 * adapter forwards `name` and `value`, and nothing about whether the browser
 * actually submits the control. This app is bundled by a real bundler and opened
 * in a real browser, which is where that claim can be tested.
 *
 * No `resolve.alias` and no `optimizeDeps.exclude`: the workspace packages are
 * consumed through their published `exports` maps, so the example proves the
 * same resolution path a consumer gets. An alias would make it prove something
 * easier.
 */
export default defineConfig({
  plugins: [react()],
  build: {
    // The default target is "modules", which is broad; pinning it to the Core
    // tier floor (section 4) keeps the example from emitting syntax the support
    // matrix does not claim. Baseline browsers are a superset.
    target: "es2020",
    outDir: "dist",
  },
  server: {
    port: 4174,
  },
})
