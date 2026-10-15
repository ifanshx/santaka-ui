---
"@santaka-ui/react": patch
"@santaka-ui/web-components": patch
---

e2e/touch-target.e2e.ts — 14 tests across Button, Icon Button, Input, Textarea,
Select, Checkbox, Switch, Radio Group, Link, and Tabs. The touch half of section
17 was asserted for Button and Icon Button and measured for nothing else.

The threshold is read from --sk-touch-min, not asserted as literal 44. Nine
assertions across five spec files assert >= 44 directly, so they keep passing if
the token changes — tests guarding a number they do not read. Negative-tested by
raising the token to 3.5rem: two tests fail here while the hardcoded ones stay
green. Migrating the rest is follow-up, and this file is where the migration
should land rather than duplicating the helper five times.

A finding, recorded rather than rounded away: sk-tab is 39px and sk-link is 24px.
Both clear WCAG 2.2 SC 2.5.8; neither reaches the project's own 44px commitment.
sk-link is exempt outright — SC 2.5.8 exempts an inline target in a sentence. They
are measured against the WCAG floor and pinned by a test that fails if they ever
reach 44, so the exception cannot linger unexamined.

The flake fix needed a second layer. Bounding turbo's task concurrency reduced the
"Failed to start forks worker" failures but did not remove them, because the two
multiply — the real ceiling is tasks x workers. packages/react/vitest.config.ts
now sets maxForks: 2 explicitly. Two consecutive verify runs pass.
