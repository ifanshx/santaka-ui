# Santaka UI

> One Design System. Every Framework. Your Code.

Santaka is an open-source, cross-framework UI ecosystem: design tokens, accessible
components, framework adapters, themes, a CLI, a component registry, and
documentation — designed so that adopting it never means being locked into one
framework, or into a runtime you do not control.

This repository is the monorepo. `plan.md` is the specification; this file is the
quick start.

## Packages

| Package | What it is |
|---|---|
| `@santaka-ui/tokens` | DTCG token source compiled to CSS custom properties. Light and dark themes. |
| `@santaka-ui/styles` | Reset, base element styles, focus-ring and visually-hidden primitives. |
| `@santaka-ui/utilities` | `cn`, `validate`, `nextId` — shared by every implementation. |
| `@santaka-ui/core` | Registry JSON Schema and untrusted-entry validation. No DOM. |
| `@santaka-ui/web-components` | The universal custom elements. The default owner of component behavior. |
| `@santaka-ui/react` | React adapter over the same custom elements. |
| `@santaka-ui/mcp` | MCP server over the registry metadata, for AI tooling. No model, no network. |
| `@santaka-ui/cli` | The `santaka` CLI: project detection, component install, diagnostics. |

## Requirements

Node.js **22.11.0+** and pnpm **10**. Corepack installs the right pnpm:

```bash
corepack enable
pnpm install
```

## Working on it

```bash
pnpm run verify
```

One command, the same one CI runs: format check, lint, typecheck, tests, build,
bundle budgets, package validation. See `CONTRIBUTING.md` for the loop, the
Definition of Done, and the architecture rules.

## Using it

Plain HTML — the eager registration path:

```html
<link rel="stylesheet" href="/node_modules/@santaka-ui/tokens/css/index.css" />
<link rel="stylesheet" href="/node_modules/@santaka-ui/web-components/santaka.css" />

<sk-button variant="primary">Save</sk-button>

<script type="module">
  import "@santaka-ui/web-components"
</script>
```

React:

```tsx
import "@santaka-ui/web-components" // registers the custom elements
import { Button, ThemeScript } from "@santaka-ui/react"
import "@santaka-ui/tokens/css/index.css"
import "@santaka-ui/react/styles.css"

export default function App() {
  return (
    <>
      <ThemeScript />
      <Button variant="primary" onClick={() => save()}>
        Save
      </Button>
    </>
  )
}
```

`ThemeScript` runs before first paint so the theme never flashes.

## Design decisions worth knowing

- **One behavior owner per component.** The universal package owns behavior.
  Where React uses Radix, the Web Components implementation must match it or the
  divergence is documented — undocumented divergence blocks the Stable label.
- **Scoped styles, not Shadow DOM** (ADR-011). Styling hooks are `data-slot`
  attributes, so consumer CSS and Tailwind utilities reach component internals.
- **No runtime CSS injection.** Component CSS ships as a file, which keeps SSR
  extraction working and removes the flash of unstyled content.
- **Contrast is a build gate.** The token build fails if any documented pair
  drops below its WCAG target, and writes a contrast report you can read.
- **Browser support is tested, not claimed.** The published matrix comes from the
  Playwright projects that actually run. It is generated, not written by hand:
  `pnpm --filter @santaka-ui/web-components test:support-matrix` runs the suite on
  each engine and writes `docs/browser-support.md`, so a browser appears in the
  document only if a project launches it and passes. Adding a browser to the docs
  without a test job is a release blocker (`plan.md` §4).

## License

MIT. See the license field in each `package.json`.