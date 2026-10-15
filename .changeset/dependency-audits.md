---

---

audit-licenses.mjs classifies every dependency into allow / review / deny. 526
packages across 13 license expressions, no denied license. Three are flagged for
review, and they are exactly the ones string matching cannot judge: a compound
SPDX expression (Apache-2.0 AND LGPL-3.0-or-later on @img/sharp-win32-x64), weak
copyleft (MPL-2.0 on axe-core and lightningcss), and a data license (CC-BY-4.0 on
caniuse-lite). They are printed with the packages that carry them so the review is
a read, not an archaeology project. The inventory is written to
docs/dependency-licenses.md.

A review tier is the reason the script is worth having — silently allowing a
compound expression is how a project acquires an obligation nobody read.

scan-security.mjs runs pnpm audit and classifies advisories by reach rather than
by severity alone. A critical in an example application and the same advisory in
a package that ships are different obligations, and a report printing only "3
critical" makes them look identical. Reach is read from the audit's own
dependency paths (findings[].paths, e.g. "examples/nextjs > next@15.5.4 >
postcss@8.4.31"), not guessed from a module name, so a transitive dependency one
level below a published package is distinguished from repository tooling. Three
classes: published (a direct dependency of a package in packages/), transitive
(reachable through a shipped package's tree), dev (tooling, examples, or the
private docs app). Both published and transitive block release at high severity
or above; dev is reported but never fails.

The current scan finds 40 advisories and none reaches a package that ships: all
are rooted at examples/nextjs — next (33, including 3 critical), sharp (3), and
postcss (4) under it. Recorded rather than hidden, with the thresholds stated so
the next person can tell what changed.

Both are negative-tested. Injecting GPL-3.0-only fails the license audit with
exit 1. The security classifier is covered by tests/security/scan-security.test.mjs,
which feeds synthetic dependency paths — because on a clean tree every advisory
would look correctly "dev" even if the classifier reported everything as "dev",
so a transitive advisory under a published package is exercised with synthetic
data. Verified load-bearing by mutating the classifier until the transitive test
fails.

Two plumbing details, found by getting them wrong: pnpm is a .cmd shim on Windows
so shell: true is required, and pnpm audit --json writes to stderr, not stdout —
reading stdout yields an empty string, which looks like a broken audit rather
than a misdirected read.
