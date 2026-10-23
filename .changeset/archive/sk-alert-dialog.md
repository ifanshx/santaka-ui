---
"@santaka-ui/core": minor
"@santaka-ui/react": minor
"@santaka-ui/web-components": minor
---

Writing the second dialog meant either copying the mechanics or extracting them -- the decision form-control-base records, met from the same side. shared/dialog-base.ts holds the panel construction, the child move, focus management, and the click delegation. Unlike the form base it contains no Stencil decorators: the compiler cannot see a runtime mixin, so each component keeps its own decorated declarations and its own documented public API.

The extraction immediately re-taught the form base's lesson at the same price: the base's state object held open as a copy, the click handler wrote the copy, and the watcher that drives the DOM methods never fired -- dialogs stopped opening until the handler was changed to write through the component's prop. A base that writes a copy writes to a place the component never sees. All twelve dialog tests pass unchanged after the rework, which is what says the mechanics were preserved.

sk-alert-dialog is defined by three removals from sk-dialog. role=alertdialog, so assistive technology announces an interruption rather than a window. No cheap dismissal: no dismissible prop, no backdrop click, and Escape is refused -- the cancel event is prevented, because a dialog that lets Escape answer its question did not need to be asked; this is the ARIA APG's requirement for the role, not a style choice. And no trigger slot: an alert is raised by the application in response to something, never opened by the user browsing, so the React package ships AlertDialog and AlertDialogContent and no AlertDialogTrigger.

Focus goes to initialFocus -- the consumer's chosen default action -- rather than the first focusable, because in a delete confirmation the wrong default is a destructive one. The panel wears a 3px danger stroke on its top edge: an interruption should look like one before a single word is read. The example page documents the raise-button placement directly: the invoking button is a sibling of the alert element, because anything inside it is moved into the panel -- which is hidden until raised. The first draft put the button inside, and it vanished into the closed panel with the rest of the content.
