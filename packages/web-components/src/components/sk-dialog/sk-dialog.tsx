import { Component, Element, h, Host, Listen, Method, Prop, State, Watch } from "@stencil/core"

/**
 * Dialog — Tier 2 floating overlay, and the first consumer of the glass
 * material.
 *
 * Behavior owner: `web-components` (section 4, Implementation ownership rule).
 *
 * It renders the native `<dialog>` element, which is in the Baseline tier
 * (Chrome 111 / Safari 16.4) and is therefore a dependency, not an enhancement:
 * the browser owns focus trapping, Escape, `::backdrop`, and inert background
 * content, and reimplementing any of those is how dialogs lose focus in exactly
 * the case nobody tested. Core-tier browsers are not asked to fake it — they
 * get the non-modal degradation below.
 *
 * State ownership follows §4 "Controlled and uncontrolled": open/closed is
 * ephemeral state the component owns outright, so there is no `defaultOpen`.
 * The caller observes `sk-open-change` and may set `open` back; the component
 * never corrects the caller.
 */
@Component({
  tag: "sk-dialog",
  scoped: true,
  shadow: false,
})
export class SkDialog {
  @Element() host!: HTMLElement

  /** Whether the dialog is showing. Reflects so page CSS can target it. */
  @Prop({ mutable: true, reflect: true }) open = false

  /**
   * Modal is the default and the usual case: the page behind is inert and the
   * focus is trapped. Non-modal (Chrome/Edge/Firefox only — Safari has no
   * `showModal`-independent backdrop) renders the panel inline without
   * blocking the page, for tool-palette-style UIs.
   */
  @Prop({ reflect: true }) modal = true

  /**
   * Closes when the backdrop is clicked. Off by default because a dialog
   * holding form input loses work to a stray click; a confirmation prompt with
   * nothing to lose wants it on.
   */
  @Prop({ reflect: true }) dismissible = false

  /**
   * The dialog's accessible name, applied to the panel when the consumer has
   * not slotted a `<sk-text>` heading. Prefer the slot: a real heading is
   * visible to everyone and doubles as the label.
   */
  @Prop() label = ""

  @State() private returnFocusTo: HTMLElement | null = null

  private dialog: HTMLDialogElement | null = null

  componentWillLoad() {
    // Stencil prerenders the light DOM; the native element must exist before
    // any open prop is honored on upgrade.
    this.dialog = document.createElement("dialog")
    this.dialog.className = "sk-glass sk-dialog__panel"
    this.dialog.setAttribute("data-slot", "panel")
    this.renderPanelContent()
    this.host.appendChild(this.dialog)
  }

  componentDidLoad() {
    // The consumer's children were parsed as children of the host, but the
    // trigger is the only one the host's own slot tree wants. Everything else
    // belongs in the panel: light-DOM <slot> distribution does not cross from
    // a host child into a programmatically-built subtree on its own, so the
    // children are moved, once, and the panel owns them from then on. A
    // MutationObserver would fight Stencil's render; a one-time move at
    // upgrade is deterministic.
    if (!this.dialog) return
    for (const child of Array.from(this.host.childNodes)) {
      if (child.nodeType === Node.ELEMENT_NODE) {
        if ((child as Element).getAttribute("slot") === "trigger") continue
        if (child === this.dialog) continue
      } else if (child.nodeType === Node.TEXT_NODE && !child.textContent?.trim()) {
        continue
      }
      this.dialog.appendChild(child)
    }
    if (this.open) this.show()
  }

  disconnectedCallback() {
    this.dialog?.close()
  }

  /**
   * The panel content lives in light DOM (scoped, not shadowed), so slotted
   * consumer markup reaches the CSS. Called once at upgrade; slotted content is
   * owned by the consumer and never re-rendered by this component.
   */
  private renderPanelContent() {
    if (!this.dialog) return
    const title = document.createElement("slot")
    title.setAttribute("name", "title")
    const body = document.createElement("slot")
    const footer = document.createElement("slot")
    footer.setAttribute("name", "footer")
    for (const el of [title, body, footer]) this.dialog.appendChild(el)
  }

  @Watch("open")
  openChanged(next: boolean) {
    // The prop is the single source of truth for *intent*; the DOM methods are
    // the only thing that can act on it. Calling show()/close() inside the
    // watcher means a consumer setting `open` programmatically gets the same
    // focus and event treatment as clicking the trigger.
    if (next) this.show()
    else this.hide()
  }

  private show() {
    if (!this.dialog) return
    this.returnFocusTo = document.activeElement as HTMLElement | null
    if (this.modal && typeof this.dialog.showModal === "function") {
      this.dialog.showModal()
    } else {
      this.dialog.show()
    }
    // Initial focus goes to the first focusable inside, or the panel itself —
    // the platform does not choose for us, and focusing nothing leaves the
    // keyboard nowhere.
    const first = this.dialog.querySelector<HTMLElement>(
      "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])",
    )
    ;(first ?? this.dialog).focus()
  }

  private hide() {
    // Focus returns to the invoker before the panel closes, so a keyboard user
    // is not dropped at the top of the document.
    this.returnFocusTo?.focus()
    this.returnFocusTo = null
    this.dialog?.close()
  }

  /**
   * Imperative open/close for non-template consumers. The props stay the
   * declarative path; these exist because some callers (a toast-style flow)
   * want to open without re-rendering.
   */
  @Method()
  async showModal() {
    this.open = true
  }

  @Method()
  async close() {
    this.open = false
  }

  @Listen("cancel", { capture: true })
  handleCancel(event: Event) {
    // Escape fires `cancel`; closing on it is the platform's default and we do
    // not fight it — but the state must flow back through the prop so the
    // consumer's listener sees the same story the DOM tells.
    event.preventDefault()
    this.open = false
    this.emitChange(false)
  }

  @Listen("close", { capture: true })
  handleClose() {
    // A close that did not come from us (native form method=dialog) still has
    // to update the reflected prop.
    if (this.open) {
      this.open = false
      this.emitChange(false)
    }
  }

  @Listen("click", { capture: true })
  handleDelegate(event: Event) {
    // `instanceof Element` narrows in a DOM lib build; Stencil's is stricter,
    // so the guard is repeated through a local of the narrowed type.
    const target = event.target as Element | null
    if (!target || typeof target.closest !== "function") return

    // The trigger is slotted page chrome, so the component owns the click that
    // opens itself — the consumer writes no wiring for the common case.
    if (target.closest("[slot='trigger']")) {
      this.open = true
      // The watcher fires the DOM methods, but the event is this handler's to
      // send: without it, a trigger-open is the one path the consumer cannot
      // observe.
      this.emitChange(true)
      return
    }

    // Backdrop dismissal: a click on the <dialog> element itself is a click on
    // the padding area behind the panel, which is how the native element
    // distinguishes it from a click on the panel's content.
    if (this.dismissible && this.open && target === this.dialog) {
      this.open = false
      this.emitChange(false)
    }
  }

  private emitChange(open: boolean) {
    this.host.dispatchEvent(new CustomEvent("sk-open-change", { detail: { open }, bubbles: true }))
  }

  render() {
    return (
      <Host data-slot="dialog" data-state={this.open ? "open" : "closed"}>
        {/*
          The trigger lives outside the panel — it is page chrome, not dialog
          content — so it is a sibling slot, not a child of the <dialog>.
        */}
        <slot name="trigger" />
      </Host>
    )
  }
}
