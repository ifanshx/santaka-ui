/**
 * Shared dialog mechanics, extracted when the second dialog (Alert Dialog)
 * needed them — the same decision `form-control-base.ts` records, met from the
 * same side: writing the second one meant either copying the mechanics or
 * extracting them, and the copy would have been two places to fix whenever the
 * focus story changed.
 *
 * This module deliberately contains **no Stencil decorators**. Stencil's
 * compiler reads decorators off component classes; mixins composed at runtime
 * are invisible to it. So the base exposes plain functions the component wires
 * into its own decorated lifecycle, and each component keeps its own @Prop /
 * @Watch / @Listen declarations — which also keeps the two components' public
 * APIs independently documented.
 *
 * The contract every dialog component honors:
 *
 *  - The native `<dialog>` element is a Baseline-tier dependency. Focus
 *    trapping, Escape, `::backdrop`, and inert background content are the
 *    browser's; nothing here reimplements them.
 *  - `open` is the single source of truth for intent. The DOM methods are the
 *    only things that act on it.
 *  - Every close path — Escape, backdrop, imperative, a consumer setting the
 *    prop — reports through one `sk-open-change` event.
 *  - Focus returns to the invoker on close.
 */

/** The state and element handles a dialog component owns. */
export type DialogState = {
  host: HTMLElement
  dialog: HTMLDialogElement | null
  open: boolean
  modal: boolean
  /** Whether the backdrop click closes. Alert Dialog forces this false. */
  dismissible: boolean
  /** Where focus goes on close; the invoker, captured at open. */
  returnFocusTo: HTMLElement | null
}

/** Event name every dialog component reports through. */
export const DIALOG_EVENT = "sk-open-change"

/**
 * Creates the native panel and slots, appending it to the host. The panel
 * carries the glass material via `.sk-glass` (styles package) and the dialog
 * layout via `.sk-dialog__panel`.
 */
export function createDialogPanel(host: HTMLElement, role: string): HTMLDialogElement {
  const dialog = document.createElement("dialog")
  dialog.className = "sk-glass sk-dialog__panel"
  dialog.setAttribute("data-slot", "panel")
  dialog.setAttribute("role", role)
  const title = document.createElement("slot")
  title.setAttribute("name", "title")
  const body = document.createElement("slot")
  const footer = document.createElement("slot")
  footer.setAttribute("name", "footer")
  for (const el of [title, body, footer]) dialog.appendChild(el)
  host.appendChild(dialog)
  return dialog
}

/**
 * Moves the consumer's non-trigger children into the panel.
 *
 * The consumer's children parse as children of the host, and light-DOM slot
 * distribution does not carry them into a programmatically-built subtree on
 * its own — so the children are moved, once, and the panel owns them from then
 * on. A MutationObserver would fight Stencil's render; a one-time move at
 * upgrade is deterministic.
 */
export function moveChildrenIntoPanel(host: HTMLElement, dialog: HTMLDialogElement): void {
  for (const child of Array.from(host.childNodes)) {
    if (child.nodeType === Node.ELEMENT_NODE) {
      if ((child as Element).getAttribute("slot") === "trigger") continue
      if (child === dialog) continue
    } else if (child.nodeType === Node.TEXT_NODE && !child.textContent?.trim()) {
      continue
    }
    dialog.appendChild(child)
  }
}

/** Opens the panel, capturing the invoker for focus return. */
export function showDialog(state: DialogState): void {
  const dialog = state.dialog
  if (!dialog) return
  state.returnFocusTo = document.activeElement as HTMLElement | null
  if (state.modal && typeof dialog.showModal === "function") {
    dialog.showModal()
  } else {
    dialog.show()
  }
  // Initial focus goes to the first focusable inside, or the panel itself —
  // the platform does not choose for us, and focusing nothing leaves the
  // keyboard nowhere.
  const first = dialog.querySelector<HTMLElement>(
    "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])",
  )
  ;(first ?? dialog).focus()
}

/** Closes the panel and returns focus to the invoker. */
export function hideDialog(state: DialogState): void {
  // Focus returns to the invoker before the panel closes, so a keyboard user
  // is not dropped at the top of the document.
  state.returnFocusTo?.focus()
  state.returnFocusTo = null
  state.dialog?.close()
}

/** Reports an open-state change through the single shared event. */
export function emitOpenChange(state: DialogState, open: boolean): void {
  state.host.dispatchEvent(new CustomEvent(DIALOG_EVENT, { detail: { open }, bubbles: true }))
}

/** The shared click delegation: trigger opens, backdrop dismisses when allowed. */
export function handleDialogClick(
  state: DialogState,
  event: Event,
  setOpen: (open: boolean) => void,
): void {
  const target = event.target as Element | null
  if (!target || typeof target.closest !== "function") return

  // The trigger is slotted page chrome, so the component owns the click that
  // opens itself — the consumer writes no wiring for the common case.
  if (target.closest("[slot='trigger']")) {
    // Written through the component's prop, never the state copy: the copy is
    // a snapshot, and a base that writes it writes to a place the watcher —
    // and therefore the DOM methods — never sees. The same lesson
    // form-control-base learned, at the same price.
    setOpen(true)
    emitOpenChange(state, true)
    return
  }

  // Backdrop dismissal: a click on the <dialog> element itself is a click on
  // the padding area behind the panel, which is how the native element
  // distinguishes it from a click on the panel's content.
  if (state.dismissible && state.open && target === state.dialog) {
    setOpen(false)
    emitOpenChange(state, false)
  }
}
