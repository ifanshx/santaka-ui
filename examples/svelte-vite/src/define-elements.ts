import { defineCustomElements } from "@santaka-ui/web-components/loader"

/**
 * Register the custom elements. Resolves once every element is defined.
 *
 * This module is imported only from `entry-client.ts`, which is the client
 * bundle, so the loader never enters the server bundle — the same two-path
 * decision `examples/nextjs` documents (ADR-005), reached from the other
 * direction. There the elements are defined in an effect so the server render
 * cannot see them; here the server render is a separate build, so a module
 * boundary is enough.
 *
 * **It must be called after hydration, not before it.** That is measured, not
 * stylistic. These elements use scoped styles and no shadow root (ADR-011), so
 * an element renders its DOM *into its own light DOM* — upgrading one mutates
 * the tree the framework is hydrating. Svelte 5 hydrates by walking the server's
 * nodes against the template the compiler emitted, and a single extra or missing
 * node ends the walk: `hydrate()` throws, catches its own error, clears the
 * target and mounts from scratch. The measured effect of registering first was
 * exactly that — `Failed to hydrate: HierarchyRequestError`, the server's markup
 * discarded, and every prop reaching the element as a property with no attribute
 * behind it.
 *
 * Registering second also matches what a React host has always done: React runs
 * effects after hydration, so `examples/nextjs` upgrades the elements after the
 * server markup is adopted. The props still arrive, because the server wrote
 * them as attributes and an element reads its attributes when it upgrades.
 */
export function defineSantakaElements(): Promise<void> {
  return defineCustomElements(window)
}
