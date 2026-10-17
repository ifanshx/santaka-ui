import { Component, Element, h, Host, Prop } from "@stencil/core"

/**
 * Progress — Tier 1 feedback component.
 *
 * Behavior owner: `web-components` (section 4, Implementation ownership rule).
 * The React package adapts this specification; it does not reimplement it.
 *
 * A progress bar is a non-interactive status display. It takes no focus, has no
 * press state, and declares nothing beyond `role="progressbar"` — a progress
 * bar that eats Tab stops is a control pretending to be a status, and the
 * existing components never confuse the two.
 *
 * Limitation, recorded deliberately: the component does not render percentage
 * text. Formatting a percentage is a locale question (3,4 % vs 3.4 %, Arabic
 * numerals, RTL considerations), and this component does not own locale policy.
 * A consumer who wants visible text pairs the bar with their own localized
 * label — that is why `label` exists as the accessible name and nothing
 * overrides it.
 */
@Component({
  tag: "sk-progress",
  // ADR-011: scoped styles, not Shadow DOM. A progress bar is exactly the
  // element a consumer restyles — the fill color above all.
  scoped: true,
  shadow: false,
})
export class SkProgress {
  /** The host itself, read only to check for a consumer's own labelling. */
  @Element() host!: HTMLElement

  /**
   * The current value. A finite number makes the bar determinate; an absent
   * (or non-finite) value makes it indeterminate — there is no honest
   * percentage to report for a task whose length is unknown, so the contract
   * says the bar sweeps instead of filling.
   */
  @Prop() value?: number

  /** The scale the value is measured against. Clamped to 0..max on render. */
  @Prop() max: number = 100

  /**
   * The accessible name. Rendered as `aria-label` only when non-empty AND only
   * when the host does not already carry `aria-label` or `aria-labelledby`,
   * because a consumer's own labelling must never be clobbered by a default.
   */
  @Prop() label = ""

  /** Track height scale. */
  @Prop({ reflect: true }) size: "sm" | "md" | "lg" = "md"

  render() {
    // `aria-valuenow`'s omission is the indeterminate signal for assistive
    // tech — spec: a progressbar without a current value is "indeterminate".
    // The value is clamped so aria state never contradicts the painted fill.
    const max = this.max
    const raw = this.value
    const indeterminate = typeof raw !== "number" || !Number.isFinite(raw)
    const value =
      typeof raw === "number" && Number.isFinite(raw) ? Math.min(Math.max(raw, 0), max) : null
    // A consumer's own labelling is never clobbered by the default.
    const ownLabel =
      this.host.hasAttribute("aria-label") || this.host.hasAttribute("aria-labelledby")

    return (
      <Host
        data-slot="progress"
        data-size={this.size}
        data-indeterminate={indeterminate ? "" : undefined}
        role="progressbar"
        aria-label={this.label && !ownLabel ? this.label : undefined}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
      >
        <div class="sk-progress__track" data-slot="track">
          <div
            class="sk-progress__bar"
            data-slot="bar"
            style={value === null ? undefined : { inlineSize: `${(value / max) * 100}%` }}
          />
        </div>
      </Host>
    )
  }
}
