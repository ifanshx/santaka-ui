import { Component, Element, h, Host, Prop } from "@stencil/core"
import {
  setupButtonLike,
  syncButtonState,
  type ButtonSize,
  type ButtonType,
  type ButtonVariant,
} from "../shared/button-base.js"

/**
 * Button — Tier 1 foundation component.
 *
 * Behavior owner: `web-components` (section 4, Implementation ownership rule).
 * The React package adapts this specification; it does not reimplement it.
 *
 * Conventions enforced here, per section 4:
 *   - `variant` and `size` are the only visual configuration props.
 *   - `disabled` and `loading` are ARIA names, not `isDisabled`.
 *   - State is exposed as `data-*` attributes for CSS and tests.
 *   - Styling hooks are `data-slot`, not utility classes.
 *
 * Keyboard, activation-blocking, and form participation live in
 * `shared/button-base.ts`, shared with `sk-icon-button`.
 */
@Component({
  tag: "sk-button",
  // ADR-011: scoped styles, not Shadow DOM. A shadow root would kill every
  // Tailwind utility and consumer override written against the internals.
  scoped: true,
  shadow: false,
  formAssociated: true,
})
export class SkButton {
  /** Visual emphasis. */
  @Prop({ reflect: true }) variant: ButtonVariant = "primary"

  /** Control height. */
  @Prop({ reflect: true }) size: ButtonSize = "md"

  /** Disables interaction. Mirrors the ARIA name. */
  @Prop({ reflect: true }) disabled = false

  /** Shows a busy state and blocks interaction. */
  @Prop({ reflect: true }) loading = false

  /**
   * `submit`, `reset`, or `button`. Native semantics, so a Button inside a form
   * behaves like the `<button>` a consumer would have written by hand.
   */
  @Prop({ reflect: true }) type: ButtonType = "button"

  /** The custom element itself. Public so the shared button base can drive it. */
  @Element() host!: HTMLElement

  private internals?: ElementInternals
  private teardown?: () => void

  componentWillLoad() {
    // `attachInternals()` runs here, not in a field initializer: Stencil
    // assigns the `@Element()` property after the constructor, so reading
    // `this.host` earlier throws. Lifecycle order is also the documented order
    // for form-associated custom elements.
    this.internals = this.host.attachInternals()

    this.teardown = setupButtonLike(this, this.internals)
    if (!this.host.hasAttribute("role")) this.host.setAttribute("role", "button")
    if (!this.host.hasAttribute("tabindex")) this.host.setAttribute("tabindex", "0")
    syncButtonState(this, this.internals)
  }

  disconnectedCallback() {
    this.teardown?.()
  }

  componentDidRender() {
    syncButtonState(this, this.internals)
  }

  render() {
    return (
      <Host
        data-slot="button"
        data-state={this.loading ? "loading" : this.disabled ? "disabled" : "idle"}
        data-disabled={this.disabled ? "" : undefined}
        data-loading={this.loading ? "" : undefined}
        aria-disabled={this.disabled || this.loading ? "true" : undefined}
      >
        {this.loading ? (
          <span class="sk-button__spinner" data-slot="spinner" aria-hidden="true" />
        ) : null}
        <span class="sk-button__label" data-slot="label">
          <slot />
        </span>
      </Host>
    )
  }
}
