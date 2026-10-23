---
"@santaka-ui/react": patch
---

`@santaka-ui/react` now has a `size` task. It was the last row in the plan's §12 budget table with no measurement, so the 15 KB overhead budget was absent from the report rather than passing — the same failure mode ADR-010 recorded for the `tokens + core` row, in the one place nobody had looked.

The measurement bundles all 37 wrappers with the peers a consumer already has held external, and reads **2.77 KB of 15**. It was negative-tested twice: lowering the budget to 2 KB exits 1, and removing the externals raises the figure to 5.95 KB, so the number responds to bundled weight rather than being a constant that happens to sit under a generous limit.

No package behavior changed.
