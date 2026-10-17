import { svelte } from "@sveltejs/vite-plugin-svelte"
import { defineConfig } from "vite"

/**
 * Vite configuration for the Svelte example (plan.md section 10, framework
 * examples; section 17, "Every form control submits through a plain `<form>`",
 * and the Svelte row's "SSR and hydration tests").
 *
 * This example is the **server-rendered** path, which is the one difference from
 * `examples/vue-vite`. It exists to prove two claims that a jsdom test cannot:
 * that Svelte's server render emits the custom element tags as real markup the
 * browser parses before any JavaScript runs, and that hydrating that markup
 * produces no mismatch and no lost prop.
 *
 * The client build is an ordinary Vite build of `index.html`, so Vite itself
 * injects the hashed stylesheet and module tags into the output HTML. The server
 * then fills the `<!--app-html-->` placeholder in that built file. Assembling
 * the tags by hand instead would mean re-implementing asset hashing here, and the
 * example would then be testing its own bookkeeping rather than the framework's.
 *
 * No `resolve.alias` and no `optimizeDeps.exclude`: the workspace packages are
 * consumed through their published `exports` maps, so the example proves the same
 * resolution path a consumer gets. An alias would make it prove something easier.
 */
export default defineConfig({
  plugins: [svelte()],
  build: {
    // The default target is "modules", which is broad; pinning it to the Core
    // tier floor (section 4) keeps the example from emitting syntax the support
    // matrix does not claim. Baseline browsers are a superset.
    target: "es2020",
    outDir: "dist/client",
    emptyOutDir: true,
  },
  server: {
    port: 4176,
  },
})
