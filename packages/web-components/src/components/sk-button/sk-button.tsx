import { Component, Element, h, Host, Prop } from "@stencil/core"

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
  @Prop({ reflect: true }) variant: "primary" | "secondary" | "outline" | "ghost" | "danger" =
    "primary"

  /** Control height. */
  @Prop({ reflect: true }) size: "sm" | "md" | "lg" = "md"

  /** Disables interaction. Mirrors the ARIA name. */
  @Prop({ reflect: true }) disabled = false

  /** Shows a busy state and blocks interaction. */
  @Prop({ reflect: true }) loading = false

  /**
   * `submit`, `reset`, or `button`. Native semantics, so a Button inside a form
   * behaves like the `<button>` a consumer would have written by hand.
   */
  @Prop({ reflect: true }) type: "button" | "submit" | "reset" = "button"

  @Element() private host!: HTMLElement

  private internals?: ElementInternals

  private onClick = (event: MouseEvent) => {
    if (this.disabled || this.loading) {
      event.preventDefault()
      event.stopImmediatePropagation()
      return
    }
    if (this.type !== "button") {
      event.preventDefault()
      this.submitForm()
    }
  }

  /**
   * Form-associated custom elements do not get implicit submission from
   * `type="submit"`: the element is not a native button, so the browser has
   * nothing to submit. A FACE has to request submission explicitly, which is
   * what `form.requestSubmit()` does — it still runs validation and still
   * fires the `submit` event, so this is the closest match to a native
   * `<button type="submit">`.
   */
  private submitForm() {
    const form = this.internals?.form
    if (!form) return
    if (this.type === "reset") {
      form.reset()
      return
    }
    form.requestSubmit()
  }

  private onKeyDown = (event: KeyboardEvent) => {
    if (this.disabled || this.loading) return
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      this.host.click()
    }
  }

  /**
   * A loading button is `aria-busy`, not `disabled`: assistive technology must
   * still be able to read the button's name and position.
   */
  private syncState() {
    const blocked = this.disabled || this.loading
    this.host.setAttribute("aria-busy", this.loading ? "true" : "false")
    if (blocked) {
      this.host.setAttribute("tabindex", "-1")
      this.internals?.setFormValue(null)
    } else if (this.host.getAttribute("tabindex") === "-1") {
      this.host.setAttribute("tabindex", "0")
    }
  }

  componentWillLoad() {
    // `attachInternals()` runs here, not in a field initializer: Stencil
    // assigns the `@Element()` property after the constructor, so reading
    // `this.host` earlier throws. Lifecycle order is also the documented order
    // for form-associated custom elements.
    this.internals = this.host.attachInternals()

    this.host.addEventListener("click", this.onClick)
    this.host.addEventListener("keydown", this.onKeyDown)
    if (!this.host.hasAttribute("role")) this.host.setAttribute("role", "button")
    if (!this.host.hasAttribute("tabindex")) this.host.setAttribute("tabindex", "0")
    this.syncState()
  }

  disconnectedCallback() {
    this.host.removeEventListener("click", this.onClick)
    this.host.removeEventListener("keydown", this.onKeyDown)
  }

  componentDidRender() {
    this.syncState()
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
