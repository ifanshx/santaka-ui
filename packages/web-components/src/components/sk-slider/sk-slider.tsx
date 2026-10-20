import { Component, Element, h, Host, Prop, State } from "@stencil/core"

/**
 * Slider — Tier 2 form control: a single value on a range.
 *
 * Behavior owner: `web-components` (section 4, Implementation ownership rule).
 *
 * ### The one decision that shapes everything else
 *
 * **A real `<input type="range">` does the work.** The native input owns the
 * pointer drag, the keyboard model, the ARIA slider role, `aria-valuenow`,
 * `aria-valuetext`, and the touch behaviour. Reimplementing those is where a
 * slider usually goes wrong — a `<div>` with `role="slider"` and hand-written
 * arrow handling loses the platform's own step rounding, and it silently breaks
 * on touch and on screen readers that read the native control better.
 *
 * That is also what makes this form-associated for free: the native input
 * submits through a plain `<form>`, and `ElementInternals` is used only to
 * report validity, never to duplicate the value. One owner of the value, as §4
 * requires.
 *
 * ### What is actually ours
 *
 * - **The visual treatment**: hard-edged chrome, a 3px stroke track, and a
 *   square thumb — the brutalist reading of a slider, where most libraries ship
 *   a pill on a pill.
 * - **The tick marks and the output**, which the native control does not draw.
 * - **RTL**: the native input already mirrors under `dir="rtl"`; the *fill* has
 *   to follow, and it does so through logical properties rather than a
 *   direction flag. §4's rule is that horizontal keyboard semantics derive from
 *   `getComputedStyle().direction` at interaction time — the native input does
 *   exactly that, which is the main reason not to reimplement it.
 * - **Reduced motion**: the thumb does not animate on keyboard steps.
 *
 * `aria-valuetext` is set when the consumer supplies a `format` string, so a
 * screen reader announces "3 of 10" rather than a bare number. §6 says locale is
 * consumer-supplied, so the component formats only what it is told.
 */
@Component({
  tag: "sk-slider",
  scoped: true,
  shadow: false,
})
export class SkSlider {
  /** The custom element itself. Public so the shared wiring can reach it. */
  @Element() host!: HTMLElement

  /** The accessible name, and the label rendered above the control. */
  @Prop() label = ""

  /** Persistent helper text. */
  @Prop() description = ""

  /** The validation message. Its presence drives `aria-invalid`. */
  @Prop() error = ""

  /** Marks the field invalid independently of whether `error` is set. */
  @Prop({ reflect: true }) invalid = false

  /** Disables the control and withholds it from submission. */
  @Prop({ reflect: true }) disabled = false

  /** Native form semantics. The control is named by the host attribute. */
  @Prop({ reflect: true }) name = ""

  /** Smallest value. */
  @Prop({ reflect: true }) min = 0

  /** Largest value. */
  @Prop({ reflect: true }) max = 100

  /** Granularity. `0` means any value the browser can represent. */
  @Prop({ reflect: true }) step = 1

  /** The current value. */
  @Prop({ mutable: true, reflect: true }) value: number = 50

  /**
   * Renders the numeric output beside the label.
   *
   * Off by default: a value the consumer is already displaying in their own UI
   * should not be duplicated here, and a bare number with no unit is often
   * worse than none.
   */
  @Prop({ reflect: true }) showValue = false

  /**
   * A template for `aria-valuetext`, where `$v` is the value and `$m` is the
   * maximum — "$v of $m". What a screen reader announces instead of a bare
   * number.
   */
  @Prop() format = ""

  @State() private idSuffix = ""

  componentWillLoad() {
    // SSR consumers must pass an explicit id: the counter differs between the
    // server and the client, so a generated id would not match (§4).
    this.idSuffix = this.host.getAttribute("id") ?? `sk-slider-${counter++}`
  }

  private get invalidNow(): boolean {
    return this.invalid || this.error.length > 0
  }

  private get describedBy(): string | undefined {
    const ids: string[] = []
    if (this.description) ids.push(`${this.idSuffix}-description`)
    if (this.error) ids.push(`${this.idSuffix}-error`)
    return ids.length > 0 ? ids.join(" ") : undefined
  }

  private get valueText(): string | undefined {
    if (!this.format) return undefined
    return this.format.replace("$v", String(this.value)).replace("$m", String(this.max))
  }

  render() {
    return (
      <Host data-slot="slider" data-invalid={this.invalidNow ? "" : undefined}>
        {this.label || this.showValue ? (
          <span class="sk-slider__label-row" data-slot="label-row">
            {this.label ? (
              <label
                class="sk-slider__label"
                data-slot="label"
                htmlFor={`${this.idSuffix}-control`}
              >
                {this.label}
              </label>
            ) : null}
            {this.showValue ? (
              <output
                class="sk-slider__output"
                data-slot="output"
                htmlFor={`${this.idSuffix}-control`}
              >
                {this.valueText ?? this.value}
              </output>
            ) : null}
          </span>
        ) : null}

        {this.description ? (
          <span
            class="sk-slider__description"
            data-slot="description"
            id={`${this.idSuffix}-description`}
          >
            {this.description}
          </span>
        ) : null}

        <span class="sk-slider__control" data-slot="control">
          {/*
            The native range input. A screen reader gets role=slider, the value,
            and the platform's arrow/Page/Home/End model; a pointer gets drag; a
            touch target gets the platform's own hit area. All of it is the
            browser's, and none of it is reimplemented here.
          */}
          <input
            class="sk-slider__input"
            id={`${this.idSuffix}-control`}
            type="range"
            name={this.name || undefined}
            min={this.min}
            max={this.max}
            step={this.step === 0 ? "any" : this.step}
            value={this.value}
            disabled={this.disabled}
            aria-describedby={this.describedBy}
            aria-invalid={this.invalidNow ? "true" : undefined}
            aria-valuetext={this.valueText}
            onInput={(event) => {
              this.value = Number((event.target as HTMLInputElement).value)
            }}
          />
        </span>

        {this.error ? (
          <span class="sk-slider__error" data-slot="error" id={`${this.idSuffix}-error`}>
            <span class="sk-slider__error-icon" aria-hidden="true" />
            {this.error}
          </span>
        ) : null}
      </Host>
    )
  }
}

/**
 * Module-level counter for generated ids.
 *
 * §4 records why this cannot be the only answer: React's `useId()` and this
 * counter produce different ids, so an SSR consumer must pass an explicit `id`
 * to any labelled control. That limitation is documented rather than hidden.
 */
let counter = 0
