---
"@santaka-ui/web-components": minor
---

The README claimed "the published matrix comes from the Playwright projects
that actually run", and there was no matrix. plan.md section 17 listed it as an
open gate and section 4 makes documenting a browser without a test job a release
blocker.

docs/browser-support.md is now generated, not written. The generator reads the
project list out of playwright.config.ts and each engine's revision from the
browser Playwright will actually launch, so a browser appears in the document
only if a project launches it, and the revision shown is the real pin rather
than a value copied from a manifest that could disagree with it. A CI job runs
the check and fails when the document and the config drift.

Two first attempts were wrong and are worth recording:

The document originally had a per-engine pass/fail column. It does not survive
CI: a committed "passed" is either stale or has to be re-verified by running all
three engines on every run, and a document that drifts is worse than one that
says less. The evidence that each engine is tested is the browsers matrix job
that runs it, which the document states.

The matrix script originally omitted CI=1, and the config marks Firefox and
WebKit as ignored off CI because only Chromium is provisioned by default. The
first run therefore reported "No tests found" for two engines and recorded them
as failed without launching them — the kind of result a matrix exists to
prevent.

Running it produced the first cross-engine evidence this repository has had. The
suite had never been exercised outside Chromium: 261 tests pass on Chromium,
260 + 1 flaky on Firefox, 261 on WebKit. The flake was tooltip.e2e.ts, whose
hover assertions bounded a 300ms component delay with a 1000ms timeout — under
parallel load that measures the scheduler, not the component, and it passed 9/9
on five consecutive isolated runs. The bound is now 2000ms, and the negative
assertion at 120ms is what still proves the delay is real.
