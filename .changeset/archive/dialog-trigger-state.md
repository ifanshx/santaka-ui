---
"@santaka-ui/web-components": patch
---

Makes the dialog family's invoker report its state, the way the popover's always
did.

`sk-popover` put `aria-expanded` and `aria-haspopup="dialog"` on its slotted
trigger; `sk-dialog`, `sk-alert-dialog`, and `sk-drawer` — which all share one set
of mechanics in `shared/dialog-base.ts` — did not. Two overlays that behave
identically announced differently, and no single component's own tests could see
it, because each looked complete on its own.

The write now happens in the shared base, so all four agree. It is applied at
upgrade as well as on open and close: `aria-expanded="false"` has to be on the
invoker from first paint, because an invoker that silently gains a state
mid-session is announced differently before and after its first use.

`sk-alert-dialog` has no trigger slot by design — the application raises it — so
the write is a no-op there rather than an error.

Negative-tested by removing the upgrade-time write from `sk-dialog`: the new test
in `dialog.e2e.ts` fails, naming the element that lost its state.
