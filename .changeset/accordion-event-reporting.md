---
"@santaka-ui/react": patch
"@santaka-ui/web-components": patch
---

sk-open-change now reports changes, not re-reads of the state an item already
had. The first cross-engine run of the suite is what found it: 328 tests on
Firefox and 328 on WebKit, and the only failures were two flaky accordion tests,
both in tests this session had just written.

The WebKit one was not timing. Probing the event stream directly showed one click
on a closed item producing THREE events there and two in Chromium: WebKit fires
an extra `toggle` for the sibling a single-open group is about to close, and that
toggle reads the node before the close has reached it, so `detailsEl.open` is
still the stale `true`. The item reported it, which told consumers an item had
opened when it was closed and stayed closed. The guard is against
`reportedOpen` — the value the item last reported — not against the `open`
property: the group closes a sibling by writing that property, so by the time the
platform's toggle for the close arrives, `open` already says `false`, and
comparing against it swallowed the close instead (observed, not reasoned about:
the count went from three events to one). Skipping the initial report is
deliberate too: an item that renders open was never reported as opening, so
`reportedOpen` starts at the authored state.

The other flake was Firefox and was a read, not a race: the marker's drawn stroke
was sampled once after the property changed, while the rule that removes it keys
off `[data-open="true"]` — the reflected attribute, written a render later. That
read is now retried.

One assertion was wrong for a third reason: it pinned the *order* of the two
events by index, and their order is not contracted — whether the sibling's close
lands inside the open's dispatch or after it differs by engine, WebKit nesting it
and Chromium queuing it. Asserting it asserted Chromium's timing as the contract.
The events are found by heading now, and the count is what pins the group's close
still being reported.

The page-side promise no longer resolves on a fixed 50 ms delay either; it
resolves when both events have arrived, with a timeout only so a missing event
fails the assertions instead of hanging the test.

Verified: the accordion suite five times over on Chromium, Firefox, and WebKit
with retries off — 135 runs, no flakes.
