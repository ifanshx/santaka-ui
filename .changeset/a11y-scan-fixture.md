---
---

The axe scans waited for the wrong thing. `beforeEach` resolved on the *first*
`.hydrated` element and then slept a fixed 500 ms, while ADR-008 requires every
custom element to be upgraded before a scan — the scan's own comment says why: an
inert `<sk-input>` renders no label wiring, and axe reports violations the
upgraded element does not have. On a loaded machine the rest upgrade after those
500 ms, so the scan reads a half-upgraded page.

Found by failing, not by reading: `verify` failed once on the two whole-page scans
(light and dark, Chromium — the only failures in that run) and passed on rerun.
Isolated runs had never caught it — 36 repeats of the three scans under four
workers passed — which is why it survived as an "unexplained pass-on-retry" in
docs/STATUS.md since the first cross-engine run.

The wait now requires every *registered* custom element to be hydrated. Filtering
by "has a hyphen" alone hangs: `slot-fb` is Stencil's slot fallback, hyphenated,
never defined, and never hydrated — that version of the wait timed out in all
three engines. Finite animations have to land too, since axe reads computed
styles, and the page's infinite ones (spinner, skeleton shimmer) are excluded
rather than waited on. `expectNoAxeViolations` now prints the scan-time state
alongside a violation — how many custom elements are upgraded, which animations
are running — so the next failure names its own cause.

No package behavior changes; this is the fixture the accessibility gate scans.
