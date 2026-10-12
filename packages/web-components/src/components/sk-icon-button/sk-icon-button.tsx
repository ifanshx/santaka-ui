import { Component, Element, h, Host, Prop } from "@stencil/core"
import {
  setupButtonLike,
  syncButtonState,
  type ButtonSize,
  type ButtonType,
  type ButtonVariant,
} from "../shared/button-base.js"

/**
 * Icon Button — Tier 1 foundation component.
 *
 * Behavior owner: `web-components` (section 4, Implementation ownership rule).
 *
 * An icon-only control is where accessibility is easiest to get wrong: it has
 * no visible text, so the accessible name has nowhere to come from unless the
 * consumer supplies one. The `label` prop is that name, and a missing one warns
 * in development rather than shipping a nameless button.
 *
 * Keyboard, activation-blocking, and form participation are shared with
 * `sk-button` through `shared/button-base.ts`.
 */

/**
 * One warning per module load, not one per element: a list of fifty icon
 * buttons should not print fifty identical lines.
 */
let warnedMissingLabel = false

@Component({
  tag: "sk-icon-button",
  scoped: true,
  shadow: false,
  formAssociated: true,
})
export class SkIconButton {
  /**
   * The accessible name. An icon-only control with no name is announced as
   * just "button", which tells a screen-reader user nothing.
   */
  @Prop() label = ""

  /** Visual emphasis. */
  @Prop({ reflect: true }) variant: ButtonVariant = "ghost"

  /** Control height. */
  @Prop({ reflect: true }) size: ButtonSize = "md"

  /** Disables interaction. Mirrors the ARIA name. */
  @Prop({ reflect: true }) disabled = false

  /** Shows a busy state and blocks interaction. */
  @Prop({ reflect: true }) loading = false

  /** Native form semantics. */
  @Prop({ reflect: true }) type: ButtonType = "button"

  /** The custom element itself. Public so the shared button base can drive it. */
  @Element() host!: HTMLElement

  private internals?: ElementInternals
  private teardown?: () => void

  componentWillLoad() {
    this.internals = this.host.attachInternals()

    this.teardown = setupButtonLike(this, this.internals)
    if (!this.host.hasAttribute("role")) this.host.setAttribute("role", "button")
    if (!this.host.hasAttribute("tabindex")) this.host.setAttribute("tabindex", "0")
    this.applyLabel()
  }

  disconnectedCallback() {
    this.teardown?.()
  }

  componentDidRender() {
    syncButtonState(this, this.internals)
    this.applyLabel()
  }

  /**
   * The accessible name comes from `label`, falling back to an `aria-label` the
   * consumer already put on the host. Never from the slotted icon: the icon is
   * decorative here, so it contributes nothing to the name.
   *
   * A missing name warns rather than being papered over with an empty
   * `aria-label`. An explicit empty attribute *overrides* the content fallback,
   * which would make the control worse than leaving it unset, and section 4
   * says an invalid prop warns in development instead of throwing in production.
   */
  private applyLabel() {
    if (this.label) {
      this.host.setAttribute("aria-label", this.label)
      return
    }
    if (this.host.hasAttribute("aria-label")) return
    if (warnedMissingLabel) return
    warnedMissingLabel = true
    console.warn(
      "[@santaka-ui] <sk-icon-button>: no accessible name. Pass `label`, or set " +
        '`aria-label` on the element. An icon-only control with no name is announced as "button".',
    )
  }

  render() {
    return (
      <Host
        data-slot="icon-button"
        data-state={this.loading ? "loading" : this.disabled ? "disabled" : "idle"}
        data-disabled={this.disabled ? "" : undefined}
        data-loading={this.loading ? "" : undefined}
        aria-disabled={this.disabled || this.loading ? "true" : undefined}
      >
        {this.loading ? (
          <span class="sk-icon-button__spinner" data-slot="spinner" aria-hidden="true" />
        ) : (
          <span class="sk-icon-button__icon" data-slot="icon" aria-hidden="true">
            <slot />
          </span>
        )}
      </Host>
    )
  }
}
