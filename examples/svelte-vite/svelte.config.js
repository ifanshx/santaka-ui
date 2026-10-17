import { vitePreprocess } from "@sveltejs/vite-plugin-svelte"

/**
 * Svelte compiler options for the example.
 *
 * `vitePreprocess` is what lets a `<script lang="ts">` block be written in
 * TypeScript; without it the block is fed to the compiler as JavaScript and the
 * first type annotation is a syntax error.
 *
 * There is deliberately no adapter here. A SvelteKit application would need
 * `@sveltejs/adapter-node`, and `@sveltejs/kit` requires TypeScript 6 while this
 * repository pins 5.9.3 (see docs/adr/ADR-021-svelte-support-and-ssr-path.md), so
 * the server render lives in `server.mjs` and uses Vite's own SSR build. The
 * comment is here rather than in a README because this is the file whose
 * missing adapter raises the question.
 */
export default {
  preprocess: vitePreprocess(),
}
