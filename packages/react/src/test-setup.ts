/**
 * jsdom has no custom-element registry of its own, so this file provides the
 * minimum the adapter tests need: a registry, `ElementInternals`, and stubs for
 * the tags the adapters render.
 *
 * The stubs matter more than they look. Without a definition, React 19 treats an
 * unknown tag as a plain element and writes every prop as an attribute, which
 * would let the adapter tests pass while the upgraded path — the one a browser
 * actually takes — goes untested.
 *
 * The stubs implement no behavior. Form submission, focus, and ARIA are owned by
 * `@santaka-ui/web-components` and proven in Chromium in that package's suite.
 */
import { beforeAll } from "vitest"

class TestElementInternals {
  form: HTMLFormElement | null = null
  readonly element: Element
  constructor(element: Element) {
    this.element = element
  }
  setFormValue(): void {}
  setValidity(): void {}
  attachInternals(): ElementInternals {
    return this as unknown as ElementInternals
  }
}

beforeAll(() => {
  if (typeof HTMLElement === "undefined" || typeof customElements === "undefined") return

  if (!HTMLElement.prototype.attachInternals) {
    Object.defineProperty(HTMLElement.prototype, "attachInternals", {
      value: TestElementInternals.prototype.attachInternals,
      writable: true,
    })
  }

  if (!customElements.get("sk-button")) {
    customElements.define(
      "sk-button",
      class extends HTMLElement {
        variant = "primary"
        size = "md"
        disabled = false
        loading = false
        type = "button"
        connectedCallback() {
          this.setAttribute("role", "button")
        }
      },
    )
  }

  if (!customElements.get("sk-icon-button")) {
    customElements.define(
      "sk-icon-button",
      class extends HTMLElement {
        label = ""
        variant = "ghost"
        size = "md"
        disabled = false
        loading = false
        type = "button"
        connectedCallback() {
          this.setAttribute("role", "button")
        }
      },
    )
  }

  if (!customElements.get("sk-link")) {
    customElements.define(
      "sk-link",
      class extends HTMLElement {
        href = ""
        external = false
        subtle = false
        target?: string
        rel?: string
        download?: string
      },
    )
  }

  if (!customElements.get("sk-badge")) {
    customElements.define(
      "sk-badge",
      class extends HTMLElement {
        variant = "neutral"
        size = "md"
        dot = false
        statusLabel = ""

        // Stencil maps a camelCase prop to its kebab-case attribute, so
        // `status-label="Active"` becomes `statusLabel` on a defined element.
        // The stub has to do the same, or an adapter test would pass while the
        // upgraded path in a browser silently dropped the accessible label.
        static get observedAttributes() {
          return ["status-label"]
        }

        attributeChangedCallback(name: string, _old: string | null, value: string | null) {
          if (name === "status-label") this.statusLabel = value ?? ""
        }
      },
    )
  }
})
