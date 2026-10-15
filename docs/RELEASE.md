# Release and versioning policy

This repository follows `plan.md` §14, and this file is where the policy is made
concrete enough to follow without re-reading the plan.

**Current state:** every published package is `0.1.0`. Nothing has been released
to npm yet.

## Version stages

| Stage | Meaning | Exit criteria |
|---|---|---|
| `0.x` | API may evolve rapidly. Breaking changes are allowed in a **minor** bump, and must be documented. | — |
| `1.0.0` | Public API is stable. | The stable support matrix and §17's release gates are met. |

Under `0.x`, a breaking change is a minor bump and is still recorded in the
changelog with a migration note. This is the honest reading of §14: `0.x` buys
freedom to *change* the API, not freedom to leave adopters guessing.

## What each bump means

| Change | Bump |
|---|---|
| Bug or security fix, no intentional public API breakage | patch |
| New component, new prop, new adapter — backward compatible | minor |
| Removed or renamed prop, changed event name, changed default that breaks a rendered result, changed required token | minor under `0.x`, major after `1.0.0` |

The last row is the one that gets argued about. The test for "breaking" is
**whether adopting code has to change**, not whether the diff is large:

- Adding a prop: not breaking.
- Renaming a prop: breaking.
- Changing a default value: breaking if the rendered result changes, not
  otherwise. `--sk-touch-min` moving from 44px to 56px is breaking; a spelling fix
  in a class name nobody targets is not.
- Adding a token: not breaking. Removing one, or changing what a token *means*:
  breaking.

## What is public API

A consumer can depend on all of it, so a change to any of it is a version event:

- Custom element tag names (`sk-button`) and their attributes/properties/events.
- The React adapter's component names, props, and exported types.
- The CSS custom properties declared by the token package.
- The stylesheet entrypoints named in each package's `exports` map.
- The registry item schema (`registry-item-v1`) and the registry payload shape.
- The MCP server's tool names and their argument shapes.
- The CLI's commands and flags.

Explicitly **not** public API, and free to change without a version bump:

- Anything under `dist/` that the `exports` map does not name. This is why
  unreachable CommonJS output could be deleted without a release note.
- Internal helper modules inside a package.

## Coordinated publishing

Packages are published in dependency order, and `tokens` and `styles` are versioned
together (`fixed` in `.changeset/config.json`) because a token change and the
reset that consumes it are one release, not two.

Framework adapters are **not** forced to the same maturity level as the universal
package (§14). React can be `0.2.0` while the Web Components package is `0.3.0`;
the adapter's version tracks its own changes, not the core's.

## Internal dependencies, and why the bump is `minor`

`.changeset/config.json` sets `updateInternalDependencies: "minor"`.

The default in most monorepos is `patch`, and it is wrong here. When
`@santaka-ui/react` depends on `@santaka-ui/web-components` and the components
package gains a **component**, the adapter has effectively gained it too — a
feature, not a fix. Publishing the adapter with only a patch bump to its
dependency would tell adopters nothing changed while the component set grew.

With `minor`, any change to an internal dependency raises the dependent package by
at least a minor version. That is deliberately conservative: it over-communicates
rather than under-communicates, which is the right direction for a version number.

## Changesets

Every publishable change carries a changeset. `changeset status` runs in CI, so a
pull request that changes a package without one fails.

A changeset names the affected packages and the bump for each, then explains
*why* — not what. The changelog is assembled from these, so a changeset that says
"update button" produces a changelog entry that says "update button". The useful
question to answer is what broke, what changed for adopters, and what they should
do.

## Releasing

```
pnpm run release:check    # build, then `changeset status`
pnpm run release          # build, then `changeset publish`
```

Neither step is run automatically on merge. Publishing is a deliberate act, and
the sequence is documented in §14: "Publish packages in a coordinated, documented
sequence."

## Pre-1.0 expectations for adopters

- Pin the version. Under `0.x`, a minor bump can carry a breaking change.
- Read the changelog before a minor bump.
- Migrations are documented in [MIGRATIONS.md](./MIGRATIONS.md).

## Scope

The library publishes nine packages. Component pages in the docs site are
generated from the registry; a rename shows up everywhere or nowhere.

| Package | Contents |
|---|---|
| `@santaka-ui/tokens` | DTCG source compiled to CSS custom properties, light and dark. |
| `@santaka-ui/styles` | Reset, base element styles, focus-ring and visually-hidden primitives. |
| `@santaka-ui/utilities` | `cn`, `validate`, `nextId`. |
| `@santaka-ui/core` | Registry JSON Schema, entry validation, and the generated registry payload. |
| `@santaka-ui/web-components` | The universal custom elements — the default owner of component behavior. Twenty-one components: alert-dialog, badge, button, card, checkbox, dialog, icon-button, input, label, link, radio-group, select, separator, skeleton, spinner, switch, tabs, text, textarea, toast, tooltip. |
| `@santaka-ui/react` | React adapter over the same custom elements. |
| `@santaka-ui/mcp` | MCP server over the registry metadata. |
| `@santaka-ui/cli` | The `santaka` command: project detection, component install, diagnostics. |

## Not yet done

- No package has been published to npm.
- The legal preconditions in §13 (trademark, npm scope, domain, mascot) are
  unresolved, and publishing waits on them.
- `1.0.0` waits on the support matrix and §17's gates.
