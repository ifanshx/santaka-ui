# ADR-004: Package naming, publish scope, and license

- **Status:** Accepted
- **Date:** 2026-10-12
- **Plan deadline:** end of weeks 1–2 (`plan.md` §18)

## Context

`plan.md` §4 fixes the npm scope as `@santaka-ui/<name>` and §14 makes **MIT** the
license, with a note that switching later is a breaking change for adopters. §13
lists legal preconditions — trademark search, npm scope availability, domain,
mascot originality — that must be resolved *before* any public commitment, because
recovering from a naming conflict after dependents exist forces breaking churn
(risk R6).

## Decision

**Scope `@santaka-ui`, license MIT, publish scope is all nine packages, all
public.**

| Package | Publishes | Contents |
|---|---|---|
| `@santaka-ui/tokens` | yes | Token source and build; `./css` ships prebuilt light/dark stylesheets |
| `@santaka-ui/core` | yes | Registry schema, validation, generated metadata. No DOM |
| `@santaka-ui/utilities` | yes | `validate`, `cn`, `id` — framework-neutral helpers |
| `@santaka-ui/styles` | yes | Reset, base elements, primitives, `glass.css` |
| `@santaka-ui/web-components` | yes | Custom elements, eagerly registered; `/loader` for SSR |
| `@santaka-ui/react` | yes | React adapters over the custom elements |
| `@santaka-ui/vue` | yes | Vue 3 adapters over the same custom elements |
| `@santaka-ui/mcp` | yes | MCP server over the registry metadata. No model, no network |
| `@santaka-ui/cli` | yes | The `santaka` CLI: project detection, install, diagnostics |

Every package declares `"license": "MIT"`, `"publishConfig": { "access": "public",
"provenance": true }`, and passes `publint` and `attw --pack`.

The monorepo root is the only `"private": true` package; nothing else in the tree
publishes unintentionally.

### Why one scope rather than per-package scopes

A single scope under one org means the npm org page is the project's public
face, transfers happen once, and a compromised publish token has one blast
radius rather than six. The cost — a consumer who wants only `@santaka-ui/react`
cannot install it without the scope — is not real, because npm resolves scopes
transparently.

## Consequences

- Publishing runs from CI only, with npm trusted publishing and provenance. No
  developer machine holds a publish token (§13).
- Every package publishes in a coordinated sequence, and the plan permits adapters
  to lag the core (§14) — `react` does not have to ship at the same moment as
  `web-components`.
- **Name and license are now load-bearing public commitments.** The npm scope and
  the `Santaka` / `Taka` names are not yet verified against the trademark
  register, and the domain is not held. That work is §13's
  `988` checkbox and it is still open; this ADR records the *decision*, not the
  verification.

## What would reverse this

A trademark conflict in the target classes, which §13 says should trigger a
rename *before* any registry, package, or domain commitment. Renaming after
publication forces a major version plus a migration guide, which is why the
verification is tracked as an open checkbox rather than considered done.