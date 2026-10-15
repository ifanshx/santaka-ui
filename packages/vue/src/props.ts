/**
 * Helpers shared by the Vue adapters.
 *
 * These exist because Vue's attribute/property assignment for custom elements
 * differs from React 19 in one way that matters: React skips a `null`/`undefined`
 * value, but Vue's `patchDOMProp` coerces it. For a property whose current value
 * is a string, Vue assigns `''`; for a number, `0`. Passing `undefined` through
 * would therefore overwrite the custom element's own default with an empty
 * string — `variant` would become `""` instead of `"primary"`, measured on a
 * defined element.
 *
 * The element already owns its defaults (Stencil declares them). The adapter's
 * job is to stay out of the way when a prop is not set, so `elementProps` drops
 * `undefined` values and leaves every other value, including `false`, intact.
 */
export function elementProps(props: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const key in props) {
    const value = props[key]
    if (value !== undefined) {
      out[key] = value
    }
  }
  return out
}

/**
 * The ref a consumer gets from `<Button ref="b" />`.
 *
 * Section 4 says every component forwards its ref to the single primary DOM node
 * and the forwarded type is the real element type. Vue's own ref on a component
 * resolves to the *instance*, whose `$el` is the element — one hop short of the
 * convention. `expose` cannot hand back the element directly either: Vue wraps an
 * exposed ref's value in a reactive proxy, and the DOM element does not survive
 * that wrap (measured: `expose(elementRef)` yields an object whose `focus` is
 * `undefined`).
 *
 * A proxy fixes both. Its `get` reads through to the live element and binds
 * methods to it, so `ref.value.focus()` calls the element's own `focus` rather
 * than a detached copy; `getPrototypeOf` reports `HTMLElement.prototype` so
 * `ref.value instanceof HTMLElement` is true. The element is read on every access
 * rather than captured, so the proxy is correct before mount and after unmount.
 */
export function elementProxy(el: { value: HTMLElement | null }): Record<string, unknown> {
  return new Proxy({} as Record<string, unknown>, {
    get: (_target, key) => {
      const element = el.value
      if (!element) return undefined
      const value = Reflect.get(element, key)
      // Bind methods to the element: calling a bound-through proxy method with
      // the proxy as `this` would throw "Illegal invocation" on a native DOM call.
      return typeof value === "function" ? value.bind(element) : value
    },
    set: (_target, key, value) => {
      if (el.value) Reflect.set(el.value, key, value)
      return true
    },
    has: (_target, key) => el.value !== null && key in el.value,
    getPrototypeOf: () => HTMLElement.prototype,
  })
}

/**
 * Build an event listener from the adapter's `on<EventName>` prop.
 *
 * Returns `undefined` when no handler was passed, so the `onSk*` key is dropped
 * by `elementProps` and no listener is attached.
 */
export function eventHandler<T>(
  handler: ((detail: T) => void) | undefined,
): ((event: Event) => void) | undefined {
  if (!handler) return undefined
  return (event: Event) => handler((event as CustomEvent<T>).detail)
}

/**
 * A prop whose value may be set or left for the element to default.
 *
 * `default: undefined` is what keeps a prop out of `elementProps` when the
 * consumer does not pass it, so the element's own default stands. It also makes
 * the prop uncontrolled from the adapter's side: the adapter never writes a
 * fallback the element did not ask for.
 */
export function optionalProp<T>(type: unknown) {
  return { type: type as never, default: undefined as T | undefined }
}
