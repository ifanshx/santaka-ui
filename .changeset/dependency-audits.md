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
critical" makes them look identical. Three classes: published, transitive, dev.
Only the first blocks release, at high severity or above.

The current scan finds 40 advisories and none reaches a published package's direct
dependencies — all are in next (33, including 3 critical) and sharp (3) from the
Next.js example, and postcss (4) from the build chain. Recorded rather than
hidden, with the thresholds stated so the next person can tell what changed.

Both are negative-tested: injecting GPL-3.0-only fails the license audit with
exit 1; injecting a critical advisory on ajv, a direct dependency of
@santaka-ui/core, fails the security scan as PUBLISHED instead of being absorbed
into the transitive bucket.

Two plumbing details, found by getting them wrong: pnpm is a .cmd shim on Windows
so shell: true is required, and pnpm audit --json writes to stderr, not stdout —
reading stdout yields an empty string, which looks like a broken audit rather
than a misdirected read.
