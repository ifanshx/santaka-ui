---
"@santaka-ui/core": minor
"@santaka-ui/web-components": minor
---

Button, Icon Button, Link, and Badge are now brutalist chrome: 3px stroke, no rounding, zero-blur offset shadow, and a physical press that lifts on hover and depresses on activation. Badge drops its color-mix() fills for the per-theme subtle tokens so a Core-tier browser no longer renders it with no fill at all, and it joins the package barrel and the registry with a test suite of its own.

Budget: token themes move from 12.22 KB to a 13 KB budget. The growth is the deliberate token surface from the previous commit — the brutal shadow ladder, the arcade motion pairs, the glass alpha group, and the four per-theme subtle fills. It is not comment weight: esbuild strips comments before measure-bundle reads the files, so the emitted $description prose is 6241 bytes either way and trimming it recovers nothing. Runtime stays at 8.91 KB / 12 KB and per-component CSS at 2.72 KB / 4 KB.
