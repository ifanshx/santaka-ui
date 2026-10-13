import { Component, Element, h, Host, Listen, Method, Prop, State, Watch } from "@stencil/core"
import {
  createDialogPanel,
  emitOpenChange,
  handleDialogClick,
  hideDialog,
  moveChildrenIntoPanel,
  showDialog,
  type DialogState,
} from "../shared/dialog-base.js"

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
 *
 * The mechanics live in `shared/dialog-base.ts`, shared with `sk-alert-dialog`.
 * The decorators stay here on purpose: Stencil's compiler cannot see a runtime
 * mixin, so a base class of decorated props would be invisible — and the
 * public API of each component is documented on the component, not in the base.
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

  @State() private state!: DialogState

  componentWillLoad() {
    // Stencil prerenders the light DOM; the native element must exist before
    // any open prop is honored on upgrade.
    const dialog = createDialogPanel(this.host, "dialog")
    this.state = {
      host: this.host,
      dialog,
      open: this.open,
      modal: this.modal,
      dismissible: this.dismissible,
      returnFocusTo: null,
    }
  }

  componentDidLoad() {
    moveChildrenIntoPanel(this.host, this.state.dialog!)
    if (this.open) showDialog(this.state)
  }

  disconnectedCallback() {
    this.state.dialog?.close()
  }

  @Watch("open")
  openChanged(next: boolean) {
    this.state.open = next
    this.state.modal = this.modal
    this.state.dismissible = this.dismissible
    // The prop is the single source of truth for *intent*; the DOM methods are
    // the only thing that can act on it. Calling show()/close() inside the
    // watcher means a consumer setting `open` programmatically gets the same
    // focus and event treatment as clicking the trigger.
    if (next) showDialog(this.state)
    else hideDialog(this.state)
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
    emitOpenChange(this.state, false)
  }

  @Listen("close", { capture: true })
  handleClose() {
    // A close that did not come from us (native form method=dialog) still has
    // to update the reflected prop.
    if (this.open) {
      this.open = false
      emitOpenChange(this.state, false)
    }
  }

  @Listen("click", { capture: true })
  handleDelegate(event: Event) {
    this.state.open = this.open
    this.state.modal = this.modal
    this.state.dismissible = this.dismissible
    handleDialogClick(this.state, event, (open) => {
      this.open = open
    })
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
