---
"@santaka-ui/web-components": minor
---

formStateRestoreCallback was implemented on all six form controls and asserted
nowhere. formResetCallback and formDisabledCallback were already covered per
component; this was the third FACE callback and the only one with no test.

e2e/form-state-restore.e2e.ts adds 9 tests. Per control: the restored state
reaches the prop, the rendered control, and FormData; a restore fires no
sk-value-change, because it is not a user action; and a mode other than
"restore" is ignored.

Driving it took a measurement rather than an assumption, and that measurement is
the part worth recording. The callback fires on a session restore, which a page
test cannot trigger. The obvious substitute — the back/forward cache — does not
fire it: navigating away and calling page.goBack() restores the DOM intact in
Chromium, so the value survives with the callback never running once. A test
built on that navigation would pass with the callback deleted, which is worse
than no test. The suite invokes el.formStateRestoreCallback(state, "restore")
directly — the platform's own call with the platform's own arguments — and
asserts the part that is this library's contract, leaving "the platform calls
it" to the browser.

Negative-tested by gutting the callback: one test fails in Input, two in
Checkbox, where the boolean path fails in both directions.

turbo.json now bounds concurrency at 50% of the CPUs. This fixes a real flake.
Turbo's default is ten concurrent tasks and it does not look at the machine;
every test task here is itself a runner that opens one worker per core, so eight
packages times a six-worker pool on a six-core machine is dozens of processes
competing for the same six cores. The symptom was vitest failing to start a
forks worker — "Timeout waiting for worker to respond" — in whichever package
lost the race, so pnpm run verify failed on a package nobody had touched. It
happened twice, in two different sessions, which is what turned it from a
one-off into a pattern. Reproduced by bounding the count
(turbo run test --concurrency=2: 159/159 React, everything green).
