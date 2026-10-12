import type { Config } from "@stencil/core"

/**
 * Stencil configuration (ADR-001).
 *
 * Decisions here are load-bearing:
 *
 * 1. `scoped: true` on each component — the project's CSS encapsulation decision
 *    (ADR-011). A shadow root would kill every Tailwind utility and every
 *    consumer global override written against component internals.
 *
 * 2. `namespace: "santaka"` — Stencil's prefix for the identifiers it generates,
 *    not the public CSS prefix. Stencil requires at least three characters, so
 *    the public `sk-` prefix (section 4, Component API conventions) is applied
 *    in component source and CSS instead.
 *
 * 3. Two output targets, for two documented entry paths:
 *    - `dist-custom-elements` with `customElementsExportBehavior:
 *      "auto-define-custom-elements"` is what `@santaka-ui/web-components` is:
 *      importing the package registers every element. This is the eager path
 *      for plain HTML, React, Vue, Svelte, and Angular.
 *    - `dist` plus `esmLoaderPath` generates the `loader/` entrypoint that SSR
 *      frameworks import to defer registration until hydration (ADR-005).
 *
 * Component CSS is deliberately NOT in the `@Component` decorator. Stencil's
 * default is to inline it into the JS bundle and inject a `<style data-styles>`
 * element at hydration; section 4 rules that out because it breaks SSR
 * extraction, defeats Tailwind/PostCSS processing, and re-introduces FOUC.
 * `scripts/build-css.mjs` concatenates the `.css` files instead.
 */
export const config: Config = {
  namespace: "santaka",
  srcDir: "src",
  taskQueue: "async",
  sourceMap: true,
  outputTargets: [
    // ESM only (plan.md section 4: "No CommonJS build is emitted"). Stencil's
    // `dist` target emits `dist/cjs/` and `index.cjs.js` unconditionally — there
    // is no `generateCjs` option on `OutputTargetDist` — which put 358 KB of
    // CommonJS in the published tarball. It was unreachable, because the exports
    // map names only the ESM entrypoints, so nothing measured it. The build step
    // deletes it instead; see scripts/strip-cjs-output.mjs.
    { type: "dist", esmLoaderPath: "../loader/" },
    {
      type: "dist-custom-elements",
      dir: "dist/components",
      externalRuntime: false,
      customElementsExportBehavior: "auto-define-custom-elements",
    },
    { type: "docs-json", file: "dist/docs.json" },
    { type: "www", serviceWorker: null, empty: false },
  ],
  extras: { enableImportInjection: true },
}

export default config
