/**
 * Shared behavior for the button family.
 *
 * `sk-button` and `sk-icon-button` are the same control with different content.
 * Their keyboard handling, activation blocking, and form participation are
 * identical, so they live here once. A second copy would be a second thing to
 * fix when a11y behavior changes, which is exactly how the two drift apart.
 *
 * The class is a mixin target, not a component: it holds no render state and
 * registers nothing.
 */

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger"
export type ButtonSize = "sm" | "md" | "lg"
export type ButtonType = "button" | "submit" | "reset"

/** The state a button-like component must expose to its subclass. */
export type ButtonLikeState = {
  host: HTMLElement
  disabled: boolean
  loading: boolean
  type: ButtonType
}

export function setupButtonLike(state: ButtonLikeState, internals?: ElementInternals) {
  const onClick = (event: MouseEvent) => {
    if (state.disabled || state.loading) {
      event.preventDefault()
      event.stopImmediatePropagation()
      return
    }
    if (state.type !== "button") {
      event.preventDefault()
      submitForm(state, internals)
    }
  }

  const onKeyDown = (event: KeyboardEvent) => {
    if (state.disabled || state.loading) return
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      state.host.click()
    }
  }

  state.host.addEventListener("click", onClick)
  state.host.addEventListener("keydown", onKeyDown)

  return () => {
    state.host.removeEventListener("click", onClick)
    state.host.removeEventListener("keydown", onKeyDown)
  }
}

/**
 * Form-associated custom elements get no implicit submission from
 * `type="submit"`: the element is not a native button, so the browser has
 * nothing to submit. A FACE must request submission explicitly, and
 * `form.requestSubmit()` is the closest match to a native
 * `<button type="submit">` — it still runs constraint validation and still
 * fires the `submit` event.
 */
function submitForm(state: ButtonLikeState, internals?: ElementInternals) {
  const form = internals?.form
  if (!form) return
  if (state.type === "reset") {
    form.reset()
    return
  }
  form.requestSubmit()
}

/**
 * A loading button is `aria-busy`, not `disabled`: assistive technology must
 * still be able to read the button's name and position. A disabled one leaves
 * the tab order, a busy one does not.
 */
export function syncButtonState(state: ButtonLikeState, internals?: ElementInternals) {
  const blocked = state.disabled || state.loading
  state.host.setAttribute("aria-busy", state.loading ? "true" : "false")
  if (blocked) {
    state.host.setAttribute("tabindex", "-1")
    internals?.setFormValue(null)
  } else if (state.host.getAttribute("tabindex") === "-1") {
    state.host.setAttribute("tabindex", "0")
  }
}
