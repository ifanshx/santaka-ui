---
"@santaka-ui/core": minor
"@santaka-ui/react": minor
"@santaka-ui/web-components": minor
---

Tier 2's third overlay completes the waiting-components triangle: a Skeleton hides from the accessibility tree because it is scaffolding; a Dialog takes focus and interrupts because a decision is forced; a Toast must do neither and announce anyway -- its whole job is to tell the user something happened while they were looking somewhere else. It carries role=status, a polite live region: announced when it appears, never taking focus, never re-announced. A toast that shouts is a dialog wearing a smaller skirt.

Three decisions the tests hold in place. The clock pauses on hover and focus -- a message that disappears mid-read is an announcement that never happened; the test parks the pointer at 4.5s of a 5s life and asserts survival at 6s. duration=0 never expires: an error the user must act on deserves more than an expired apology. And the close button carries a real aria-label -- a bare multiplication sign is a picture to a screen reader, and a toast that is announced and then cannot be dismissed is a trap.

It is deliberately not a native <dialog>: a toast never takes focus, so the dialog element's machinery -- trapping, backdrop, inertness -- would be wrong here rather than merely unused. The panel is a plain glass div stacked at --sk-z-toast (1500), below the modal layer (1700): a dialog's scrim covers toasts, because a modal decision outranks a notification. Both numbers are asserted.

It is a single toast, not a toaster: placement is the page's concern, and a component that owned the queue would own the page's layout too. Severity is a 3px left edge plus the message text, never color alone, matching the ruling Input's error icon made. Runtime budget raised 14 to 15 KB with the rationale recorded in measure-bundle.mjs; the per-component CSS average has fallen on every addition and now sits at 1.86 KB.
