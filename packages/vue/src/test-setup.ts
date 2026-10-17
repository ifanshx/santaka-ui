/**
 * jsdom has no custom-element registry of its own, so this file provides the
 * minimum the adapter tests need: a registry, `ElementInternals`, and stubs for
 * the tags the adapters render.
 *
 * The stubs matter more than they look. Without a definition, Vue 3 treats an
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

  // `readonly` is the one attribute whose name differs from its camelCase prop:
  // the HTML attribute is lowercase, so Stencil's default kebab mapping is
  // overridden in the component. The stub has to observe the same name.
  if (!customElements.get("sk-input")) {
    customElements.define(
      "sk-input",
      class extends HTMLElement {
        type = "text"
        variant = "default"
        size = "md"
        label = ""
        description = ""
        error = ""
        invalid = false
        disabled = false
        readOnly = false
        required = false
        value = ""
        defaultValue = ""
        minLength?: number
        maxLength?: number
        pattern = ""

        // Vue writes an unknown prop on a custom element as an attribute rather
        // than a property, so `minlength={2}` arrives here as an attribute.
        // Observing it is what keeps the stub faithful to a real upgraded
        // element; without it an adapter test would read `undefined` where a
        // browser reads 2.
        static get observedAttributes() {
          return ["readonly", "minlength", "maxlength"]
        }

        attributeChangedCallback(name: string, _old: string | null, value: string | null) {
          if (name === "readonly") this.readOnly = value !== null
          if (name === "minlength") this.minLength = value === null ? undefined : Number(value)
          if (name === "maxlength") this.maxLength = value === null ? undefined : Number(value)
        }
      },
    )
  }

  if (!customElements.get("sk-textarea")) {
    customElements.define(
      "sk-textarea",
      class extends HTMLElement {
        rows = 4
        cols?: number
        variant = "default"
        label = ""
        description = ""
        error = ""
        invalid = false
        disabled = false
        readOnly = false
        required = false
        value = ""
        defaultValue = ""
        minLength?: number
        maxLength?: number

        static get observedAttributes() {
          return ["readonly", "minlength", "maxlength"]
        }

        attributeChangedCallback(name: string, _old: string | null, value: string | null) {
          if (name === "readonly") this.readOnly = value !== null
          if (name === "minlength") this.minLength = value === null ? undefined : Number(value)
          if (name === "maxlength") this.maxLength = value === null ? undefined : Number(value)
        }
      },
    )
  }

  // Checkbox and Switch carry the same prop surface (the Switch contract is the
  // Checkbox contract), including the `value` that decides what the form
  // receives and the `default-checked` attribute whose name differs from its
  // camelCase prop. Both stubs declare a class field for every *element
  // property* so Vue assigns them as properties, the path a browser takes on an
  // upgraded element.
  //
  // `name` is deliberately not declared. The shipped elements have no `name`
  // prop — a form-associated custom element is named by its host *attribute*,
  // which is what the platform reads — so `"name" in element` is false on a real
  // element and Vue writes the attribute. Declaring `name` here would make it an
  // own property, divert that write to the property path, and let the adapter's
  // `name` tests pass while the browser took the other route. The stub follows
  // the element instead, and `form-name.test.ts` asserts the consequence.
  if (!customElements.get("sk-checkbox")) {
    customElements.define(
      "sk-checkbox",
      class extends HTMLElement {
        variant = "default"
        size = "md"
        label = ""
        description = ""
        error = ""
        invalid = false
        disabled = false
        required = false
        form?: string
        checked = false
        defaultChecked = false
        value = "on"
        indeterminate = false
      },
    )
  }

  if (!customElements.get("sk-card")) {
    customElements.define(
      "sk-card",
      class extends HTMLElement {
        variant = "default"
        padding = "md"
        heading = ""
        subtitle = ""
      },
    )
  }

  if (!customElements.get("sk-text")) {
    customElements.define(
      "sk-text",
      class extends HTMLElement {
        variant = "base"
        family = "inherit"
        muted = false
      },
    )
  }

  if (!customElements.get("sk-spinner")) {
    customElements.define(
      "sk-spinner",
      class extends HTMLElement {
        size = "md"
        label = "Loading"
        status = ""
      },
    )
  }

  if (!customElements.get("sk-skeleton")) {
    customElements.define(
      "sk-skeleton",
      class extends HTMLElement {
        variant = "text"
        direction = "ltr"
      },
    )
  }

  if (!customElements.get("sk-label")) {
    customElements.define(
      "sk-label",
      class extends HTMLElement {
        forId = ""
        required = false
        marker = "after"
      },
    )
  }

  if (!customElements.get("sk-separator")) {
    customElements.define(
      "sk-separator",
      class extends HTMLElement {
        orientation = "horizontal"
        decorative = false
        // The element declares `label` as a property too, so it is written as
        // one; omitting it here would make the adapter's label test read
        // `undefined` and look like a dropped prop rather than a thin stub.
        label = ""
      },
    )
  }

  if (!customElements.get("sk-dialog")) {
    customElements.define(
      "sk-dialog",
      class extends HTMLElement {
        open = false
        modal = true
        dismissible = false
        label = ""
      },
    )
  }

  if (!customElements.get("sk-alert-dialog")) {
    customElements.define(
      "sk-alert-dialog",
      class extends HTMLElement {
        open = false
        label = ""
        initialFocus = ""
      },
    )
  }

  if (!customElements.get("sk-toast")) {
    customElements.define(
      "sk-toast",
      class extends HTMLElement {
        open = false
        duration = 5000
        variant = "neutral"
      },
    )
  }

  if (!customElements.get("sk-tooltip")) {
    customElements.define(
      "sk-tooltip",
      class extends HTMLElement {
        open = false
        placement = "top"
        delay = 300
      },
    )
  }

  if (!customElements.get("sk-select")) {
    customElements.define(
      "sk-select",
      class extends HTMLElement {
        options: Array<{ value: string; label: string }> = []
        variant = "default"
        size = "md"
        label = ""
        description = ""
        error = ""
        invalid = false
        disabled = false
        required = false
        placeholder = ""
        value = ""
        defaultValue = ""
      },
    )
  }

  if (!customElements.get("sk-tabs")) {
    customElements.define(
      "sk-tabs",
      class extends HTMLElement {
        active = 0
      },
    )
  }

  if (!customElements.get("sk-tab")) {
    customElements.define(
      "sk-tab",
      class extends HTMLElement {
        label = ""
      },
    )
  }

  if (!customElements.get("sk-tab-panel")) {
    customElements.define("sk-tab-panel", class extends HTMLElement {})
  }

  // Switch and Radio Group follow their shipped components' prop surfaces.
  // Switch's stub reflects `checked` from the attribute so `default-checked`
  // reads back as a property, the way Stencil's reflection would.
  if (!customElements.get("sk-switch")) {
    customElements.define(
      "sk-switch",
      class extends HTMLElement {
        variant = "default"
        size = "md"
        label = ""
        description = ""
        error = ""
        invalid = false
        disabled = false
        required = false
        form?: string
        checked = false
        defaultChecked = false
        value = "on"

        static get observedAttributes() {
          return ["checked", "default-checked"]
        }

        attributeChangedCallback(name: string, _old: string | null, value: string | null) {
          if (name === "checked") this.checked = value !== null
          if (name === "default-checked") this.defaultChecked = value !== null
        }
      },
    )
  }

  if (!customElements.get("sk-radio-group")) {
    customElements.define(
      "sk-radio-group",
      class extends HTMLElement {
        options: Array<{ value: string; label: string; disabled?: boolean }> = []
        variant = "default"
        size = "md"
        label = ""
        description = ""
        error = ""
        invalid = false
        disabled = false
        required = false
        form?: string
        name = ""
        value = ""
        defaultValue = ""
      },
    )
  }

  // The five new components follow their shipped elements' prop surfaces. Like
  // sk-switch above, all of them render into light DOM (stencil "scoped"), so
  // the stubs are inert default-carrying classes; heading/label-style props go
  // through properties, and `open` on sk-accordion-item is the reflectable
  // `<details>` state the real element mirrors on a user toggle.
  if (!customElements.get("sk-alert")) {
    customElements.define(
      "sk-alert",
      class extends HTMLElement {
        variant = "neutral"
        heading = ""
      },
    )
  }

  if (!customElements.get("sk-progress")) {
    customElements.define(
      "sk-progress",
      class extends HTMLElement {
        value?: number
        max = 100
        label = ""
        size = "md"
      },
    )
  }

  if (!customElements.get("sk-empty-state")) {
    customElements.define(
      "sk-empty-state",
      class extends HTMLElement {
        variant = "default"
        size = "md"
        heading = ""
        description = ""
      },
    )
  }

  if (!customElements.get("sk-accordion")) {
    customElements.define(
      "sk-accordion",
      class extends HTMLElement {
        multiple = false
        variant = "default"
      },
    )
  }

  if (!customElements.get("sk-accordion-item")) {
    customElements.define(
      "sk-accordion-item",
      class extends HTMLElement {
        heading = ""
        open = false
      },
    )
  }

  if (!customElements.get("sk-table")) {
    customElements.define(
      "sk-table",
      class extends HTMLElement {
        variant = "default"
        density = "default"
        striped = false
        label = ""
      },
    )
  }
})
