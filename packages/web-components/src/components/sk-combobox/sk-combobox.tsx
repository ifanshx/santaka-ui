import { Component, Element, h, Host, Prop, State } from "@stencil/core"

/**
 * Combobox — Tier 2 form control: a text field with a filterable list.
 *
 * Behavior owner: `web-components` (section 4, Implementation ownership rule).
 *
 * ### The ARIA pattern, and the part everyone gets wrong
 *
 * The ARIA 1.2 combobox pattern is four separate pieces, and a component that
 * merges them is a component a screen reader cannot drive:
 *
 * 1. The **input** carries `role="combobox"`, `aria-expanded`, and
 *    `aria-controls` pointing at the listbox.
 * 2. The **listbox** carries `role="listbox"` and is the element `aria-controls`
 *    names.
 * 3. **Focus never leaves the input.** The active option is reported through
 *    `aria-activedescendant` on the input, not by moving focus into the list.
 *    Moving focus is the common mistake: it fires a blur on the field the reader
 *    is typing into, and every screen reader announces it as leaving.
 * 4. The **options** carry `role="option"` and `aria-selected`, with ids
 *    `aria-activedescendant` can name.
 *
 * ### Decisions specific to this component
 *
 * - **A real `<input>` inside the host**, and the list is a real `<ul>`. The
 *   component filters; it does not reimplement text editing. Native validation,
 *   IME, and autofill all keep working because the input is the input.
 * - **§4's event rule**: `sk-value-change` fires only for user-initiated changes.
 *   Filtering as the reader types is not a value change — only a committed
 *   selection is.
 * - **Escape closes without clearing.** Closing and reverting are different
 *   commands; the reader's typed text is their work.
 * - **No `aria-live` announcement of the result count.** It looks helpful and is
 *   a known anti-pattern: it interrupts on every keystroke. The listbox
 *   relationship already tells a screen reader the results changed.
 *
 * §6: the component does no locale-sensitive work. Matching is a plain
 * case-insensitive substring, which is the wrong collation for some locales and
 * is deliberately left to the consumer, who may pass pre-filtered options.
 */
@Component({
  tag: "sk-combobox",
  scoped: true,
  shadow: false,
})
export class SkCombobox {
  @Element() host!: HTMLElement

  /** The accessible name, and the label rendered above the field. */
  @Prop() label = ""

  /** Persistent helper text. */
  @Prop() description = ""

  /** The validation message. Its presence drives `aria-invalid`. */
  @Prop() error = ""

  /** Marks the field invalid independently of whether `error` is set. */
  @Prop({ reflect: true }) invalid = false

  /** Disables the control. */
  @Prop({ reflect: true }) disabled = false

  /** Native form semantics. */
  @Prop({ reflect: true }) name = ""

  /** Placeholder. Never a substitute for a label. */
  @Prop() placeholder = ""

  /** The options, as JSON: `[{ "value": "…", "label": "…" }]`. */
  @Prop() options: string | Array<{ value: string; label: string }> = "[]"

  /** The selected value. */
  @Prop({ mutable: true, reflect: true }) value = ""

  @State() private query = ""
  @State() private open = false
  @State() private activeIndex = -1

  private input: HTMLInputElement | null = null

  private get base(): string {
    return this.host.id || "sk-combobox"
  }

  private parsed(): Array<{ value: string; label: string }> {
    if (Array.isArray(this.options)) return this.options
    try {
      const parsed: unknown = JSON.parse(this.options || "[]")
      return Array.isArray(parsed) ? (parsed as Array<{ value: string; label: string }>) : []
    } catch {
      return []
    }
  }

  private get visible(): Array<{ value: string; label: string }> {
    const options = this.parsed()
    if (!this.query) return options
    const needle = this.query.toLowerCase()
    return options.filter((option) => option.label.toLowerCase().includes(needle))
  }

  private get activeId(): string | undefined {
    if (this.activeIndex < 0) return undefined
    return `${this.base}-option-${this.activeIndex}`
  }

  private commit(option: { value: string; label: string }) {
    this.value = option.value
    this.query = option.label
    if (this.input) this.input.value = option.label
    this.open = false
    this.activeIndex = -1
    // Fired for a user action only — typing is not a value change, and a prop
    // update never emits (§4).
    this.host.dispatchEvent(
      new CustomEvent("sk-value-change", {
        detail: { value: option.value },
        bubbles: true,
        composed: true,
      }),
    )
  }

  private onInput = (event: Event) => {
    const value = (event.target as HTMLInputElement).value
    this.query = value
    this.open = true
    this.activeIndex = -1
    // Typing is not a value change: the field is being filtered, not committed.
  }

  private onKeydown = (event: KeyboardEvent) => {
    const options = this.visible

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault()
      if (!this.open) this.open = true
      if (options.length === 0) return
      const delta = event.key === "ArrowDown" ? 1 : -1
      // Wrapping, for the same reason the tabs wrap: a dead end in a list is a
      // keyboard trap with extra steps.
      //
      // From the inactive state (-1) the two directions are not symmetric by
      // arithmetic alone: -1 + 1 is the first option, but -1 - 1 would be the
      // second-to-last rather than the last. So "no active option yet" is
      // handled before the modulo.
      if (this.activeIndex < 0) {
        this.activeIndex = delta > 0 ? 0 : options.length - 1
        return
      }
      this.activeIndex = (this.activeIndex + delta + options.length) % options.length
      return
    }

    if (event.key === "Enter") {
      if (!this.open || this.activeIndex < 0) return
      event.preventDefault()
      const option = options[this.activeIndex]
      if (option) this.commit(option)
      return
    }

    if (event.key === "Escape") {
      if (!this.open) return
      event.stopPropagation()
      // Closes without clearing: the reader's typed text is their work, and
      // closing is not the same command as reverting.
      this.open = false
      this.activeIndex = -1
      return
    }

    if (event.key === "Tab") {
      this.open = false
      this.activeIndex = -1
    }
  }

  private onFocusOut = () => {
    // Delayed so a click on an option lands before the list closes.
    setTimeout(() => {
      this.open = false
      this.activeIndex = -1
    }, 0)
  }

  render() {
    const options = this.visible
    const listboxId = `${this.base}-listbox`
    const describedBy = [
      this.description ? `${this.base}-description` : null,
      this.error ? `${this.base}-error` : null,
    ]
      .filter(Boolean)
      .join(" ")
    const isInvalid = this.invalid || this.error.length > 0

    return (
      <Host data-slot="combobox" data-invalid={isInvalid ? "" : undefined}>
        {this.label ? (
          <label class="sk-combobox__label" data-slot="label" htmlFor={`${this.base}-input`}>
            {this.label}
          </label>
        ) : null}

        {this.description ? (
          <span
            class="sk-combobox__description"
            data-slot="description"
            id={`${this.base}-description`}
          >
            {this.description}
          </span>
        ) : null}

        <div class="sk-combobox__control" data-slot="control">
          {/*
            Focus stays here for the whole interaction. `aria-activedescendant`
            names the active option instead of moving focus into the list, which
            is what keeps the reader in the field they are typing into.
          */}
          <input
            class="sk-combobox__input"
            id={`${this.base}-input`}
            ref={(el) => (this.input = el ?? null)}
            type="text"
            role="combobox"
            name={this.name || undefined}
            value={this.query}
            placeholder={this.placeholder || undefined}
            disabled={this.disabled}
            autocomplete="off"
            aria-expanded={String(this.open)}
            aria-controls={listboxId}
            aria-activedescendant={this.activeId}
            aria-describedby={describedBy || undefined}
            aria-invalid={isInvalid ? "true" : undefined}
            onInput={this.onInput}
            onKeyDown={this.onKeydown}
            onFocusout={this.onFocusOut}
          />

          <ul
            class="sk-glass sk-combobox__listbox"
            id={listboxId}
            data-slot="listbox"
            role="listbox"
            aria-label={this.label || undefined}
            hidden={!this.open}
          >
            {options.length === 0 ? (
              <li class="sk-combobox__empty" data-slot="empty" role="presentation">
                No matches
              </li>
            ) : (
              options.map((option, index) => (
                <li
                  class="sk-combobox__option"
                  data-slot="option"
                  id={`${this.base}-option-${index}`}
                  role="option"
                  aria-selected={String(option.value === this.value)}
                  data-active={index === this.activeIndex ? "" : undefined}
                  onClick={() => this.commit(option)}
                >
                  {option.label}
                </li>
              ))
            )}
          </ul>
        </div>

        {this.error ? (
          <span class="sk-combobox__error" data-slot="error" id={`${this.base}-error`}>
            <span class="sk-combobox__error-icon" aria-hidden="true" />
            {this.error}
          </span>
        ) : null}
      </Host>
    )
  }
}
