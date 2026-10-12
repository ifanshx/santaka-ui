/**
 * Deterministic id generation for framework-neutral code paths.
 *
 * React components use `useId()`; Web Components cannot, so they call this.
 * The two id spaces deliberately do not agree — that is the documented SSR
 * limitation in section 4 (Forms integration contract): server-rendered
 * consumers must pass an explicit `id` to any labeled control.
 */
let counter = 0

export function nextId(prefix = "sk"): string {
  counter += 1
  return `${prefix}-${counter.toString(36)}`
}
