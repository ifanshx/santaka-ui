/**
 * `cn` — class name joiner shared by every Santaka UI implementation.
 *
 * Deliberately not a Tailwind-merge clone: it accepts plain strings, falsy
 * values, and arrays, which is all the component API contract requires. A
 * consumer that needs Tailwind conflict resolution already has `tailwind-merge`
 * in their own toolchain, and duplicating it here would cost bundle budget for
 * no component-visible benefit.
 */
export type ClassValue =
  | string
  | number
  | false
  | null
  | undefined
  | ClassValue[]
  | { readonly [key: string]: boolean | null | undefined }

function collect(value: ClassValue, out: string[]): void {
  if (!value && value !== 0) return
  if (typeof value === "string" || typeof value === "number") {
    const trimmed = String(value).trim()
    if (trimmed) out.push(trimmed)
    return
  }
  if (Array.isArray(value)) {
    for (const item of value) collect(item, out)
    return
  }
  for (const [key, enabled] of Object.entries(value)) {
    if (enabled) collect(key, out)
  }
}

/**
 * Join class names, dropping falsy values and preserving author order.
 * The caller controls precedence: pass the consumer class **last** so its
 * styles win (section 4, Component API conventions).
 */
export function cn(...values: ClassValue[]): string {
  const out: string[] = []
  for (const value of values) collect(value, out)
  return out.join(" ")
}
