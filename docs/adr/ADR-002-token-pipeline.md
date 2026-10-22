# ADR-002: Token source format and build pipeline

- **Status:** Accepted (with a recorded deviation from §5's toolchain table)
- **Date:** 2026-10-12
- **Specification:** §4 of [ARCHITECTURE.md](../ARCHITECTURE.md)

## Context

`docs/ARCHITECTURE.md` §5's toolchain table names **`style-dictionary`** with DTCG input as
the token pipeline, and §6 requires tokens authored in **DTCG format**
(`tokens.dev` draft) as the neutral source of truth. The plan also requires:

- compile DTCG → CSS custom properties → framework artifacts;
- the build to fail loudly on an unknown token reference or a contrast pair
  below its documented target;
- generated artifacts committed only when a consumer needs them offline,
  otherwise git-ignored and never hand-edited;
- every semantic token to ship with a documented description, its dark-theme
  value, and the fallback used when the token is unset.

## Decision

**DTCG JSON as the source; a hand-rolled build script as the compiler.**

`style-dictionary` is **not** used. This is a recorded deviation from §5, and the
reason is the contrast gate.

`style-dictionary` formats tokens and can be extended with transforms and
filters, but it has no notion of a *contrast gate* — a pair of tokens that must
clear a ratio, reported by name, with the measured number, before anything is
written. That is a hard requirement of §4's error contract and §6's "change one
and the change is a design change with a contrast re-check, not a tweak."

Adding it would mean either:

1. a custom transform that reimplements WCAG relative luminance and the gate,
   parsing its own output — at which point `style-dictionary` is a formatting
   layer over logic we wrote anyway; or
2. running the build twice, formatting with `style-dictionary` and gating
   separately, which splits the "fail before writing" guarantee across two tools.

The pipeline is 200 lines of plain Node with no dependency, and the whole of it
is testable without running a build: `scripts/token-pipeline.mjs` holds the pure
functions (flatten, resolve, sRGB→OKLCH, contrast) and 28 unit tests exercise
them directly. `scripts/build-tokens.mjs` is only filesystem wiring.

## What the pipeline does

- Resolves `{token.path}` references, failing loudly on an unknown reference or a
  cycle rather than emitting an invalid token.
- Emits every color **twice** — a hex declaration first, then `oklch()` behind
  `@supports` — so a Core-tier browser renders the intended color instead of
  inheriting the page color.
- Splits typography tokens carrying `$extensions.sk.fontWeight` /
  `sk.letterSpacing` into `-size`, `-line-height`, `-weight`, and `-tracking`
  custom properties, so a component can override one without restating the rest.
- Runs 25 contrast gates across both themes and writes
  `dist/css/contrast-report.txt`.
- **Writes nothing** if any gate fails.

`dist/` is git-ignored; consumers get prebuilt CSS through
`@santaka-ui/tokens/css`, which is the only token artifact that ships.

## Consequences

- No token-tooling dependency, and no upgrade treadmill on one.
- The DTCG shape is still readable by Tokens Studio and Storybook, which was the
  point of choosing DTCG over a proprietary format.
- If contrast gating ever moves to a token-standard tool, the swap is the
  `CONTRAST_GATES` array plus the emitter — the pure functions stay.

## What would reverse this

`style-dictionary` shipping first-class contrast gating with per-pair reporting,
or the pipeline needing transforms `style-dictionary` provides well (referenced
aliases, token sets, per-platform output) beyond what 200 lines covers.