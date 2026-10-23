import { Component, Element, Fragment, h, Host, Listen, Prop, State, Watch } from "@stencil/core"

/**
 * Tabs — Tier 2, and the last v1.0 component.
 *
 * Behavior owner: `web-components` (section 4, Implementation ownership rule).
 * The React package adapts this specification; it does not reimplement it.
 *
 * The ARIA tabs pattern has one hard rule this component is built around:
 * **the tablist owns the keyboard**. Only the active tab is in the tab order
 * (roving `tabindex`); arrow keys move activation; Home/End jump to the
 * ends. A tablist whose tabs are all tab stops makes the user press Tab once
 * per tab to get past the widget — which is exactly the experience the pattern
 * exists to prevent.
 *
 * Arrow semantics invert under RTL (§4): the direction is read from
 * `getComputedStyle` at interaction time, never from a build flag, so a
 * document with `dir="rtl"` gets Arrow-Right meaning *previous* for free.
 *
 * Activation is automatic (follow focus), the ARIA Authoring Practices
 * default: an arrow key both moves and activates, so there is no second key
 * press between reading a tab and seeing its panel.
 *
 * The parts communicate through DOM relationships the component computes and
 * writes — `aria-controls` on each tab pointing at its panel's id,
 * `aria-labelledby` on each panel pointing back — because tabs and panels are
 * separately slotted and cannot see each other at authoring time.
 */
@Component({
  tag: "sk-tabs",
  scoped: true,
  shadow: false,
})
export class SkTabs {
  @Element() host!: HTMLElement

  /** The active tab's index. Zero-based, over the tabs in DOM order. */
  @Prop({ mutable: true, reflect: true }) active = 0

  /**
   * Fired after the active tab changes, by keyboard or by prop.
   *
   * Dispatched manually rather than through `@Event()`: Stencil's decorator
   * leaks its internal `EventEmitter` type into the public `.d.ts`, which
   * breaks package validation (attw, InternalResolutionError). Every other
   * component event in this library dispatches a `CustomEvent` the same way.
   */
  private emitChange(index: number) {
    // Bubbles and composed, exactly like `@Event()` produced and like every
    // other component event: a consumer may listen on an ancestor, not the
    // tablist itself.
    this.host.dispatchEvent(
      new CustomEvent("sk-tab-change", { detail: { index }, bubbles: true, composed: true }),
    )
  }

  @State() private tabCount = 0

  /**
   * Whether the consumer supplied their own tablist wrapper.
   *
   * `role="tablist"` must sit on an ancestor of every `role="tab"`, and the slot
   * wrapper a consumer authors is plain markup until this component names it. If
   * the consumer forgets the wrapper entirely, every tab ends up with no required
   * parent — axe reports `aria-required-parent`, and the ARIA pattern is broken
   * in a way the page cannot see. So the component supplies the wrapper when it
   * is missing: the failure mode becomes impossible rather than documented.
   */
  @State() private hasTablist = false

  private tablist: HTMLElement | null = null

  /**
   * True while activate() is writing `active` itself. The watcher's
   * re-entrant call during that write must only re-sync — never emit.
   */
  private applying = false

  componentDidLoad() {
    this.sync()
  }

  /**
   * Re-sync after every render, not only the first.
   *
   * `hasTablist` is state: when the component decides to supply its own tablist
   * wrapper, that decision changes the DOM, which needs a render, which changes
   * which element carries `role="tablist"`. A one-shot sync in `componentDidLoad`
   * named the role on the first pass and never saw the wrapper it had just
   * created — measured: axe still reported `aria-required-parent` after the fix.
   */
  componentDidRender() {
    this.sync()
  }

  @Watch("active")
  activeChanged(next: number) {
    // External prop sets land here and behave exactly like a click. The
    // re-entrant call from activate()'s own write is already applied by the
    // caller, so it only re-syncs.
    if (this.applying) return
    if (this.show(next, false)) this.emitChange(this.active)
  }

  /** Recomputes every relationship the pattern requires. Idempotent. */
  private sync() {
    const tabs = this.tabs()
    this.tabCount = tabs.length
    // The consumer's wrapper is in the light DOM before this component renders,
    // so it can be found by attribute. Slot assignment is not usable here: the
    // <slot> element only exists on one render branch, and at first render
    // nothing has been assigned to it yet — which made the check report
    // "not authored" even when a wrapper was right there.
    this.hasTablist = !!this.host.querySelector("[slot='tablist']")
    this.tablist = this.host.querySelector("[data-slot='tablist']")
    // `role="tablist"` belongs on the container: axe's aria-required-parent
    // rule (and the ARIA APG) require each `role="tab"` to be owned by one.
    // The slot wrapper the consumer authored is plain markup until this
    // assigns the role, so the consumer cannot forget it silently.
    if (this.tablist) {
      this.tablist.setAttribute("role", "tablist")
    }

    tabs.forEach((tab, index) => {
      const panel = this.panelFor(tab)
      tab.setAttribute("role", "tab")
      tab.setAttribute("aria-selected", index === this.active ? "true" : "false")
      // Roving tabindex: the active tab is the only tab stop.
      tab.setAttribute("tabindex", index === this.active ? "0" : "-1")
      if (panel) {
        const panelId = panel.id || `sk-tab-panel-${index}`
        panel.id = panelId
        tab.setAttribute("aria-controls", panelId)
        panel.setAttribute("aria-labelledby", `${tab.id || `sk-tab-${index}`}`)
        tab.id = tab.id || `sk-tab-${index}`
        // Only the active panel is rendered; the rest are removed from the
        // tree, which is what `hidden` does.
        panel.hidden = index !== this.active
      }
      tab.setAttribute("data-state", index === this.active ? "active" : "inactive")
    })
  }

  private tabs(): HTMLElement[] {
    return Array.from(this.host.querySelectorAll("[data-slot='tab']"))
  }

  private panelFor(tab: HTMLElement): HTMLElement | null {
    const index = this.tabs().indexOf(tab)
    const panels = this.host.querySelectorAll("[data-slot='panel']")
    return (panels[index] as HTMLElement | undefined) ?? null
  }

  /**
   * Applies state without emitting. Reports whether anything changed, so
   * both the interaction path and the prop path emit exactly once.
   */
  private show(index: number, moveFocus: boolean): boolean {
    const tabs = this.tabs()
    if (tabs.length === 0) return false
    // Wrap: Arrow-Right on the last tab lands on the first. A dead end in a
    // roving-tabindex widget is a keyboard trap by another name.
    const next = ((index % tabs.length) + tabs.length) % tabs.length
    if (next === this.active && tabs[next]?.getAttribute("aria-selected") === "true") return false
    this.active = next
    this.sync()
    // Focus the tab *host*, not the inner button. The host carries the roving
    // tabindex and the `role="tab"` wiring; it survives the scoped re-render,
    // while the inner button node may be replaced mid-flight, silently
    // dropping focus to `body` and swallowing the next keypress.
    if (moveFocus) tabs[next]?.focus()
    return true
  }

  /** Activates a tab by index, moving focus when the interaction was a keypress. */
  private activate(index: number, moveFocus: boolean) {
    const before = this.active
    this.applying = true
    try {
      this.show(index, moveFocus)
    } finally {
      this.applying = false
    }
    // One activation, one event: the watcher's re-entrant call ran under the
    // flag and only re-synced, so the emission belongs here alone.
    if (this.active !== before) this.emitChange(this.active)
  }

  @Listen("keydown")
  handleKeydown(event: KeyboardEvent) {
    const target = event.target as HTMLElement | null
    // The key lands on the tab's inner `<button>` (or on the tab host itself,
    // when focus was moved programmatically to it); walk up to the tab.
    const tab = target?.closest("[data-slot='tab']") ?? null
    if (!tab) return

    // RTL inversion, read at interaction time (section 4) — a build-time flag
    // would be wrong for a document that switches direction at runtime.
    const rtl = getComputedStyle(this.host).direction === "rtl"
    const nextKey = rtl ? "ArrowLeft" : "ArrowRight"
    const prevKey = rtl ? "ArrowRight" : "ArrowLeft"

    const handlers: Record<string, () => void> = {
      [nextKey]: () => this.activate(this.active + 1, true),
      [prevKey]: () => this.activate(this.active - 1, true),
      Home: () => this.activate(0, true),
      End: () => this.activate(this.tabCount - 1, true),
      // Enter and Space activate the focused tab. The tab host is not a real
      // `<button>` — a button inside a role=tab is a nested-interactive
      // violation — so activation is this widget's job, not the platform's.
      Enter: () => {
        const index = this.tabs().indexOf(tab as HTMLElement)
        if (index >= 0) this.activate(index, false)
      },
      " ": () => {
        const index = this.tabs().indexOf(tab as HTMLElement)
        if (index >= 0) this.activate(index, false)
      },
    }
    ;(window as unknown as { __tabsLog?: string[] }).__tabsLog?.push(
      "key=" + event.key + " active=" + this.active + " keys=" + Object.keys(handlers).join(","),
    )
    const handler = handlers[event.key]
    if (handler) {
      event.preventDefault()
      handler()
    }
  }

  @Listen("click", { capture: true })
  handleClick(event: Event) {
    const target = event.target as HTMLElement | null
    const tab = target?.closest("[data-slot='tab']") as HTMLElement | null
    if (!tab) return
    const index = this.tabs().indexOf(tab)
    if (index >= 0 && index !== this.active) {
      // A click is a pointer interaction; focus follows anyway, because the
      // click already moved it.
      this.activate(index, false)
    }
  }

  render() {
    return (
      <Host data-slot="tabs">
        {this.hasTablist ? (
          <Fragment>
            <slot name="tablist" />
            <slot />
          </Fragment>
        ) : (
          <div data-slot="tablist">
            <slot />
          </div>
        )}
      </Host>
    )
  }
}
