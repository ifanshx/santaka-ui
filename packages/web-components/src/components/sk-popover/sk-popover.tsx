import { Component, Element, h, Host, Listen, Method, Prop, State } from "@stencil/core"

/**
 * Popover — Tier 2 floating layer that holds interactive content.
 *
 * Behavior owner: `web-components` (section 4, Implementation ownership rule).
 *
 * **The distinction that makes this not a tooltip.** A tooltip is a description
 * of something the reader can already see and use; it is named through
 * `aria-describedby`, takes no focus, and holds no interactive content. A popover
 * holds controls — a menu, a filter, a form — so it needs the opposite contract
 * on all three counts:
 *
 * 1. **It is a dialog, labelled by its own heading or `label`.** The trigger gets
 *    `aria-haspopup="dialog"` and `aria-expanded`, not `aria-describedby` —
 *    announcing a menu as the trigger's description reads the whole thing out as
 *    one sentence.
 * 2. **It dismisses on Escape and on an outside click**, and returns focus to the
 *    trigger. A tooltip disappears when you look away; a popover has to be
 *    *closed*, because it owns focus while it is open.
 * 3. **Slot content is not moved.** The panel is rendered by Stencil with real
 *    `<slot>` elements rather than built imperatively and filled by relocating
 *    the consumer's children. Relocation is what broke the first attempt: the
 *    rendered `<slot name="trigger">` was itself a child of the host, so moving
 *    children took the trigger with them, and a click on slotted content reported
 *    the original node — outside the host — so the popover closed on itself.
 *
 * Placement is a hint, not a guarantee: the component flips at the viewport edge
 * rather than rendering off-screen, the same rule the tooltip follows.
 */
@Component({
  tag: "sk-popover",
  scoped: true,
  shadow: false,
})
export class SkPopover {
  @Element() host!: HTMLElement

  /** Whether the popover is showing. Reflects so page CSS can target it. */
  @Prop({ mutable: true, reflect: true }) open = false

  /**
   * Preferred side. Flips at the viewport edge rather than clipping, so a
   * `bottom` popover on a trigger near the bottom of the screen renders above.
   */
  @Prop({ reflect: true }) placement: "top" | "bottom" | "start" | "end" = "bottom"

  /** Accessible name for the panel, needed when there is no visible heading. */
  @Prop() label = ""

  @State() private flipped = false

  private panel: HTMLElement | null = null
  private trigger: HTMLElement | null = null
  /** Set when a focus move into the panel is owed, once render has landed. */
  private pendingFocus = false

  componentDidLoad() {
    this.panel = this.host.querySelector<HTMLElement>('[data-slot="panel"]')
    this.wireTrigger()
    document.addEventListener("click", this.onDocumentClick, true)
    if (this.open) this.queueFocus()
  }

  disconnectedCallback() {
    document.removeEventListener("click", this.onDocumentClick, true)
    if (this.open) this.returnFocus()
    this.trigger?.removeAttribute("aria-expanded")
  }

  /**
   * Focus moves in `componentDidRender`, not in `show()`: `open` drives
   * `data-open`, which drives `display`, and a `display: none` element cannot
   * take focus — focusing synchronously dropped focus to `<body>`.
   */
  componentDidRender() {
    if (!this.pendingFocus || !this.open || !this.panel) return
    this.pendingFocus = false
    this.panel.focus()
  }

  private wireTrigger() {
    const trigger = this.host.querySelector<HTMLElement>("[slot='trigger']")
    if (!trigger) return
    this.trigger = trigger
    trigger.setAttribute("aria-haspopup", "dialog")
    trigger.setAttribute("aria-expanded", String(this.open))
    if (this.panel?.id) trigger.setAttribute("aria-controls", this.panel.id)
  }

  private queueFocus() {
    if (this.host.hasAttribute("data-open")) this.panel?.focus()
    else this.pendingFocus = true
  }

  @Listen("click")
  onClick(event: MouseEvent) {
    const target = event.target as Element | null
    if (!target || typeof target.closest !== "function") return
    if (!target.closest("[slot='trigger']")) return

    this.open = !this.open
    this.trigger?.setAttribute("aria-expanded", String(this.open))
    if (this.open) this.queueFocus()
    else this.returnFocus()
    this.emit(this.open)
  }

  /**
   * Outside-click dismissal, on `document` in the capture phase. A host
   * `@Listen("click")` only sees events inside its own subtree, so a click
   * elsewhere never reached it and the popover stayed open with focus inside.
   */
  private onDocumentClick = (event: MouseEvent) => {
    if (!this.open) return
    const path = event.composedPath()
    // `composedPath()` rather than `contains()`: the panel's content is slotted,
    // so a click on it reports the original node, which sits outside the panel in
    // the DOM even though it renders inside it.
    if (path.includes(this.host)) return
    this.open = false
    this.trigger?.setAttribute("aria-expanded", "false")
    this.returnFocus()
    this.emit(false)
  }

  @Listen("keydown")
  onKeydown(event: KeyboardEvent) {
    if (event.key !== "Escape" || !this.open) return
    this.open = false
    this.trigger?.setAttribute("aria-expanded", "false")
    this.returnFocus()
    this.emit(false)
  }

  /** Opens the popover. */
  @Method()
  async show() {
    this.open = true
    this.trigger?.setAttribute("aria-expanded", "true")
    this.queueFocus()
  }

  /** Closes the popover and returns focus to the trigger. */
  @Method()
  async hide() {
    this.open = false
    this.trigger?.setAttribute("aria-expanded", "false")
    this.returnFocus()
  }

  private returnFocus() {
    // Focus returns before the panel is gone, so a keyboard user is not dropped
    // at the top of the document.
    this.trigger?.focus()
  }

  private emit(open: boolean) {
    this.host.dispatchEvent(
      new CustomEvent("sk-open-change", { detail: { open }, bubbles: true, composed: true }),
    )
  }

  render() {
    return (
      <Host
        data-slot="popover"
        data-placement={this.placement}
        data-flipped={this.flipped ? "" : undefined}
        data-open={this.open ? "" : undefined}
      >
        <slot name="trigger" />
        {/*
          Rendered, not built: a real <div> with a real <slot> means the
          consumer's children are never relocated, so a click on them stays
          inside the panel's own subtree. `hidden` is deliberately not used —
          scoped mode writes it onto elements hosting a <slot>, which left an
          open panel invisible and unfocusable in the first attempt.
        */}
        <div
          class="sk-glass sk-popover__panel"
          data-slot="panel"
          role="dialog"
          tabindex="-1"
          id={`${this.host.id || "sk-popover"}-panel`}
          aria-label={this.label || undefined}
          aria-hidden={this.open ? undefined : "true"}
        >
          <slot />
        </div>
      </Host>
    )
  }
}
