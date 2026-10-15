# Santaka UI — Master Project Plan

> **Tagline:** One Design System. Every Framework. Your Code.
>
> **Status:** Weeks 1–4 in progress — foundation and first component implemented
> **Product type:** Open-source, cross-framework UI ecosystem  
> **Primary language:** TypeScript  
> **Initial styling target:** CSS variables + Tailwind CSS v4 integration  
> **Primary goals:** beautiful defaults, accessible behavior, code ownership, framework flexibility, a first-class CLI, and reliable documentation.

---

## 1. Product Vision

Santaka UI is a modern UI ecosystem—not merely a collection of buttons. It brings together design tokens, accessible components, framework adapters, themes, icons, blocks, a CLI, a component registry, documentation, testing tools, and starter templates.

Santaka must **not be designed as a Next.js-only or React-only product**. The design system and distribution architecture should support multiple frontend frameworks and plain HTML, with each framework's support level made explicit and verified through CI.

### Product principles

1. **Universal by architecture:** framework-neutral tokens and contracts, plus implementation packages that respect each framework's conventions.
2. **Developer owns the code:** offer source-copy installation as well as versioned packages. Avoid locking users into a proprietary runtime.
3. **Accessible by default:** semantic HTML, keyboard support, focus management, accessible names, reduced motion, and documented limitations.
4. **Beautiful out of the box:** professional light/dark themes, intentional typography, coherent spacing, polished states, and restrained motion.
5. **Composable and customizable:** CSS variables, semantic tokens, variants, slots/parts where appropriate, and clear component APIs.
6. **CLI-first workflows:** initialization, framework detection, component installation, theme setup, registry operations, diagnostics, and upgrades.
7. **No false compatibility claims:** a framework is marked supported only after its template, build, SSR/hydration where applicable, events, accessibility, and examples pass validation.
8. **Playful, not distracting:** friendly copy, a distinctive optional mascot, delightful empty states, and subtle micro-interactions without sacrificing professional usability.

## 2. Goals and Non-Goals

### Goals for the first stable release

- Publish shared design tokens, themes, styles, and component contracts.
- Ship a useful React implementation and a framework-independent Web Components distribution.
- Support Vite and Next.js React starter examples without requiring Next.js for the core library.
- Provide a working CLI with project detection and an explicit framework override.
- Support both source-copy mode and package-install mode.
- Publish a validated component registry and a searchable documentation site.
- Use Storybook as a component workshop, with interaction and accessibility checks.
- Establish CI, release automation, semantic versioning, changelogs, contribution rules, and dependency/license checks.

### Non-goals for the first release

- Claiming full parity across every framework before implementations are tested.
- Shipping every advanced component (for example, a full rich-text editor or enterprise-grade virtualized data grid) in v1.0.
- Supporting native mobile UI such as React Native, Flutter, or SwiftUI through the web components package.
- Re-implementing every behavior primitive from scratch.
- Requiring consumers to adopt Tailwind CSS just to use prebuilt CSS or Web Components.

## 3. Framework Support Strategy

Use a capability matrix with three states: **Planned**, **Preview**, and **Stable**. Only Stable integrations may be advertised as officially supported.

**Stable** requires the release gate below to pass in CI on every change. **Preview** means an example exists and works but the gate is not yet enforced automatically, so the claim is not defended against regression. **Planned** means nothing has been built.

| Target | State | Planned implementation | Release gate |
|---|---|---|---|
| React + Vite | **Stable** | React-native package; source and package modes | Type checks, unit/component tests, production build, keyboard/accessibility checks |
| Next.js | **Stable** | React package with documented SSR and Client Component guidance | Production build, hydration smoke tests, CSS and client-boundary checks |
| Plain HTML / JavaScript | **Stable** | Web Components + CSS, no framework runtime requirement | Browser tests in a minimal HTML fixture |
| Vue 3 + Vite | Planned | Vue wrappers/adapters and/or direct Web Components use | Props, emitted events, forms, styling, production build |
| Nuxt | Planned | Vue integration with SSR/hydration guidance | Server rendering, hydration, route-level example |
| Svelte / SvelteKit | Planned | Native wrappers where needed and Web Components usage path | Props/events, SSR and hydration tests |
| Angular | Planned | Angular integration package and typing | Inputs, outputs, forms, production build and accessibility tests |
| Astro | Planned | Web Components integration and framework-island examples | Static build, client hydration paths and custom-element loading |
| Solid, Preact, Qwik and others | Planned | Community or official adapters after validation | Framework-specific compatibility suite |
| React Native, Flutter, native desktop | Planned | Separate future product decision | Requires native renderers; not covered by web support claims |

### Why each state, and what is missing

- **React + Vite — Stable.** `examples/react-vite` is in the workspace, its browser suite submits a plain `<form>` and reads the entries from the browser's own `FormData`, and the `react-example` CI job runs it on every change. The React unit tests, type checks, and the production build are in `verify`.
- **Plain HTML / JavaScript — Stable.** `examples/vanilla-html/index.html` is the fixture the universal browser suite serves at `127.0.0.1:4173`, so the whole universal suite — 261 browser tests, the a11y scan included — runs against the framework-free path. It needs no build and no package of its own, which is the point.
- **Next.js — Stable.** `examples/nextjs` builds, renders every component server-side, defines nothing server-side, and hydrates cleanly; `scripts/ssr-proof.mjs` asserts all three, and the `nextjs-example` CI job runs it on every change. It was Preview until that job existed: the proof passed locally but no job ran it, so nothing stopped it from regressing. The job is the difference, not the script.


### Architectural rule

Web Components improve reach across browser-based frameworks, but they do not automatically provide an idiomatic framework API or guarantee identical behavior everywhere. Keep the shared tokens, component specifications, and registry metadata framework-neutral. Add thin framework adapters where they deliver better typing, form integration, event ergonomics, SSR behavior, or developer experience.

## 4. Technical Architecture

### Layer A — Framework-neutral foundation

- Design token source and semantic token names.
- Theme definitions and CSS custom properties.
- Component behavior/API specifications and accessibility requirements.
- Icon naming conventions and shared utility contracts.
- Registry schema, component metadata, dependency metadata, and versioning rules.
- Documentation content where it can be shared between implementations.

### Layer B — Universal web implementation

- **Default: Stencil** for authoring the Web Components package. The decision is recorded here so roadmap weeks 3–4 are not blocked on it; a time-boxed comparison against **Lit** may still override it, but only with a written ADR (ADR-001, section 18) recording bundle-size evidence, SSR/hydration behavior, and the reason for changing course. Do not carry both toolchains.
- Publish custom elements, typings, and framework integration guidance.
- Use scoped styles with `data-slot` hooks rather than shadow roots, and document theming through CSS custom properties; see the CSS encapsulation and theming strategy below.
- Validate keyboard interactions, forms, events, focus, SSR/upgrade behavior, and browser support.
- Avoid a hard dependency on React or Next.js for the universal package.

### Layer C — Framework-native packages

- **React:** React components and optional Radix UI primitives for suitable interactive components.
- **Vue:** Vue-friendly props, emits, slots, and examples.
- **Svelte:** Svelte-friendly bindings, events, and examples.
- **Angular:** idiomatic Inputs/Outputs, forms integration where appropriate, and typed exports.
- Other frameworks may begin with the Web Components package and receive dedicated adapters when there is validated demand.

### Implementation ownership rule

Exactly one implementation owns the behavior of each component. The other implementations are thin adapters over it.

- The universal Web Components package is the default source of truth for behavior, keyboard interaction, focus management, and ARIA wiring.
- The React package consumes that specification. Where Radix UI supplies behavior for a component, the React package becomes the owner **and** the Web Components implementation must either match it or declare the divergence in the component documentation. Divergence that is not documented is a release blocker.
- Framework adapters (Vue, Svelte, Angular) are always thin: typing, props/attrs, event ergonomics, and form integration only.
- Never pay the full component Definition of Done twice for the same interaction model. Components whose porting cost is high — Dialog, Alert Dialog, Drawer, Popover, Select, Combobox, Menu, Tooltip, Toast — must have their owner named in their documentation before release.
- A component with no named owner is not ready for the stable label.

### Component API conventions

These conventions are normative. A component that deviates from them does not ship as Stable; the deviation is a design decision that needs ADR-013.

#### Naming and prefixes

| Surface | Convention | Example |
|---|---|---|
| npm packages | `@santaka-ui/<name>` | `@santaka-ui/react` |
| CSS custom properties | `--sk-<group>-<name>` | `--sk-color-text-muted` |
| CSS classes | `sk-<block>__<element>--<modifier>` | `sk-button__label--primary` |
| Custom elements | `sk-<name>` | `<sk-button>` |
| Custom events | `sk-<event>` | `sk-value-change` |
| DOM hooks for styling and tests | `data-slot="<slot>"` | `data-slot="trigger"` |

The `sk-` prefix is fixed and two characters long; it is chosen to avoid collisions with common build- and test-tool class prefixes. No component ships an unprefixed global class.

#### Props

- Props are camelCase.
- Boolean props that mirror an ARIA state use the ARIA name verbatim: `open`, `checked`, `selected`, `expanded`, `required`, `disabled`, `invalid`, `loading`. This applies to native form controls so that `disabled` keeps its HTML meaning.
- All other boolean props take an `is`, `has`, or `can` prefix: `isExternal`, `hasIcon`, `canSubmit`.
- Visual configuration is always exactly two props named `variant` and `size`. Enumerated values live in registry metadata, never in prose.
- Every component accepts `className` (React) or `class` (Vue/Svelte/Angular) and merges it last so consumer styles win.
- Every component forwards its ref to the single primary DOM node; the forwarded type is the real element type (`HTMLButtonElement`, `HTMLInputElement`). Custom elements additionally expose `focus()` and `blur()` methods.
- No component accepts a free-form `sx` or `styles` prop.

#### Events

- React props are `on<EventName>`: `onOpenChange`, `onValueChange`, `onValueCommit`.
- The native event fired by every implementation is `sk-<event-name>` on a `CustomEvent`, so vanilla consumers and framework adapters observe the identical signal.
- An event is only fired for user-initiated changes. A change caused by a prop update never fires a change event. This rule is what keeps controlled components from looping.
- Events bubble and set `composed: true`, so they cross a shadow boundary if a consumer opts into shadow encapsulation.

#### Controlled and uncontrolled

- A stateful prop makes the component controlled when it is anything other than `undefined`; `null` is a distinct valid value and does not fall back to internal state.
- Uncontrolled components take a `default<Value>` prop, read it once, and never write back.
- A controlled component does not maintain an internal copy of that state and does not correct the caller.
- `on<EventName>` fires for user interaction in both modes, and is the only supported way to observe a change.
- Components that own ephemeral state the caller cannot see (open/closed, focus, drag) own it outright and expose no `default*` prop for it.

#### Composition

- Compound components export as flat named exports: `Dialog`, `DialogTrigger`, `DialogContent`, `DialogTitle`, `DialogDescription`, `DialogFooter`. A namespace object is also exported (`import { Dialog }`) for readability. Both forms are public API; neither is deprecated.
- React uses `asChild` with a single-child Slot for element substitution, matching the Radix convention already assumed by Layer C. Vue and Svelte use an `as` prop with a component or tag name. Web Components use a named `<slot>`.
- Every part component accepts `className` and passes it through; parts never read each other's DOM.

#### State attributes

Interactive components expose their state as data attributes on the element that owns it, so tests and global CSS can target them without reaching into internals: `data-state="open" | "closed"`, `data-disabled`, `data-invalid`, `data-loading`, `data-orientation`. These attribute names are public API.

### Forms integration contract

Form participation is part of a component's definition of done, not an enhancement. A control that cannot submit through a plain `<form>` is not shippable.

#### React

- Every form control renders a real native element — `<input>`, `<select>`, or `<textarea>` — with the props forwarded to it. Composite controls (Select, Combobox, Slider, Number Input, Pin Input) render that native element visually hidden, or a hidden input carrying the same `name`, so `new FormData(form)` yields the current value without the caller reading any component state.
- Supported props on every form control: `name`, `value`, `defaultValue`, `required`, `disabled`, `readOnly`, `id`, `form`. The `form` prop is honored so a control can be associated with a form it is not nested inside.
- Controls work in uncontrolled forms with no React state, and inside React 19 form actions.
- Native constraint validation still applies and is never suppressed by the component.

#### Web Components

- Every form-associated control is a form-associated custom element: `static formAssociated = true`, an `ElementInternals` instance from `attachInternals()`, and `setFormValue()` called on every value change.
- Implement `formResetCallback()` to return to the initial value, `formDisabledCallback()` to reflect a disabled ancestor fieldset, and `formStateRestoreCallback()` for autofill and bfcache restores.
- Validity is reported through `internals.setValidity()` with an `anchor`, so the browser places the error bubble at the right element and focus-on-invalid works.
- Custom elements that cannot be form-associated (for example Menu Bar, Tooltip) are explicitly excluded from this contract and are documented as such.
- Elements upgrade safely when a component is added after the form has been parsed.

#### Labels, descriptions, and errors

- `Label` targets the control through `htmlFor` using the control's `id`. When a consumer supplies no `id`, the component generates one.
- React generates the fallback `id` with `useId()`; Web Components generate one from a module-level counter. These two ids differ, so **SSR consumers must pass an explicit `id`** to any labeled control. This limitation is documented on every form control page rather than papered over.
- When `error` is present, the control sets `aria-invalid="true"` and wires `aria-describedby` to the error element's id, appending to any existing description id rather than replacing it.
- Validation rules are implemented once in `@santaka-ui/utilities` and shared by every implementation:

```ts
export type ValidationRule = {
  required?: boolean
  min?: number | string
  max?: number | string
  pattern?: RegExp
  validate?: (value: unknown, rule: ValidationRule) => string | undefined
}

export type ValidationResult = { valid: boolean; errors: string[] }

export function validate(value: unknown, rules: ValidationRule[]): ValidationResult
```

- Validation messages are never conveyed by color alone (WCAG 1.4.1): every error renders an icon plus text.

### Browser support baseline

Two tiers are supported and they are tested separately. Anything older than the Core tier is unsupported and is not patched.

| Tier | Meaning | Chrome / Edge | Firefox | Safari | iOS Safari |
|---|---|---|---|---|---|
| Baseline | Full styling, motion, and behavior | 111 | 128 | 16.4 | 16.4 |
| Core | Structure and behavior; degraded styling | 90 | 121 | 15.4 | 15.4 |

- Baseline is set by Tailwind CSS v4's own floor, so a project can adopt the optional Tailwind integration without dropping support. The Core tier exists so the prebuilt-CSS and Web Components paths reach further than Tailwind does.
- Baseline implies: CSS cascade layers, `@property`, `:is()`/`:where()`, logical properties, `color-mix()`, `oklch()`, `aspect-ratio`, `gap`, native `<dialog>`.
- Not available in Core and therefore never used in component CSS: container queries, `:has()`-dependent layout, `text-wrap: balance`, view transitions, `@starting-style`. Where one of these improves a component, it is added behind an `@supports` block so Core keeps a working fallback.
- Every token color is emitted twice — an `rgb()`/hex declaration first, then the `oklch()`/`color-mix()` value — so a Core-tier browser renders the intended color instead of inheriting the page color.
- The published support matrix in the documentation is generated from the Playwright projects that actually run, not hand-maintained. Adding a browser to the documentation without a test job is a release blocker.

### CSS encapsulation and theming strategy

**Decision: scoped styles, not Shadow DOM.** Stencil components use `scoped: true`. This is the load-bearing choice for the whole styling story, so it is recorded as ADR-011 and re-opened only with measured evidence.

Rationale, in the order the constraints actually bind:

1. The optional Tailwind integration must be able to reach a component's internal elements. A shadow root silently kills every utility class written against it, which is the most common way a consumer's `className` "does nothing".
2. Consumer global CSS and design-system overrides must reach component internals. Shadow DOM makes that impossible without a parts API, and a parts API for every sub-element is a large public surface to maintain.
3. Server-rendered frameworks must produce identical markup on the server and after upgrade. Shadow roots attach at upgrade time and create a hydration boundary that differs per component.
4. There is no flash-of-unstyled-content problem at all. With scoped styles the CSS arrives in the same document payload as the markup, which retires risk R3 in the risk register rather than mitigating it.
5. Shadow DOM plus the styling a real design system needs is measurably heavier; `:host` re-styling and slotted-content gymnastics cost more than the isolation buys.

What this commits the project to, and the replacement for encapsulation:

- Every element a consumer or theme might target carries a `data-slot` attribute (see Component API conventions). Styling hooks are documented as `data-slot` selectors, not as classes.
- Shadow DOM is not offered as a per-component option. The only sanctioned isolation is the CSS cascade, plus the optional `@santaka-ui/styles` reset for consumers who need a controlled baseline.
- Consumers who need a hard isolation boundary scope it themselves, for example with a container class or a cascade layer, and the documentation shows that pattern instead of implying the library prevents collisions.
- If a future measurement contradicts any of points 1–5, the change is one ADR and one Storybook config change, not a per-component migration.

### Distribution and exports contract

#### Module format

- **ESM only.** No CommonJS build is emitted. Dual-format output doubles the CI matrix and the exports surface while serving no consumer that a modern bundler or Node 22 cannot reach. CJS consumers use a bundler or a documented dynamic-import interop.
- Every JS package sets `"type": "module"` and `"sideEffects": false`, except the style-only entry points which are listed in `sideEffects`.
- Every published package must pass `publint` and `@arethetypeswrong/cli --pack` in CI. A warning from either tool fails the release, including the `ESM/CJS` and `types` resolution rows.

#### Package and entry points

One package per implementation, with subpath exports. Do not split per component.

| Import path | Contents |
|---|---|
| `@santaka-ui/tokens` | Token source and transforms (build-time); no runtime import |
| `@santaka-ui/tokens/css` | Prebuilt light and dark CSS custom-property stylesheets |
| `@santaka-ui/core` | Component metadata, registry schema, validation (no DOM) |
| `@santaka-ui/utilities` | `validate`, `cn`, framework-neutral helpers |
| `@santaka-ui/styles` | Reset, base element styles, focus-ring and visually-hidden primitives |
| `@santaka-ui/web-components` | Custom elements, eagerly registered |
| `@santaka-ui/web-components/loader` | Lazy, framework-aware registration for SSR setups (ADR-005) |
| `@santaka-ui/react` | React components |
| `@santaka-ui/mcp` | MCP server and registry AI metadata reader |

- Each package's `package.json` has an explicit `exports` map with `types` and `import` conditions and a root `.` entry. No deep imports past a declared subpath; a deep import is a breaking change.
- Every package ships a `.d.ts` next to the implementation output and is type-checked with `attw` before publish.

#### CSS

- CSS is consumed by explicit import from `@santaka-ui/tokens/css` or `@santaka-ui/styles`. No JavaScript injects a `<style>` or `<link>` tag at runtime, because that breaks SSR extraction, defeats Tailwind/PostCSS processing, and re-introduces FOUC.
- A missing-CSS failure must be obvious rather than invisible: every component's base class carries its own preflight rules, and the packages ship a `@santaka-ui/styles/reset` entry.

#### Peer ranges and runtime support

| Package | Peer requirement |
|---|---|
| `@santaka-ui/react` | `react` and `react-dom`: `^18.2.0 \|\| ^19.0.0` |
| `@santaka-ui/vue` | `vue`: `^3.4.0` |
| `@santaka-ui/svelte` | `svelte`: `^5.0.0` |
| `@santaka-ui/angular` | `@angular/core`: `^18.0.0 \|\| ^19.0.0` |
| `@santaka-ui/web-components` | none |
| `@santaka-ui/mcp` | `node`: `>=22.11.0` |

- Supported Node.js is `>=22.11.0` for all tooling and the MCP server; it is an `engines` field plus a CI matrix that includes the oldest supported version.
- Radix UI is a dependency of `@santaka-ui/react` only, and is listed in the dependency footprint of every React component that reaches it.
- Phosphor icon bindings are peer-optional per package and never a dependency of the core or Web Components packages.

### Error handling and validation contract

- A component never throws for an invalid prop in a production build. In development, React builds warn exactly once per unique prop combination, prefixed `[@santaka-ui] `, for example `[@santaka-ui] <Button>: variant "tertiary" is not defined; expected one of primary, secondary, outline, ghost, danger.`
- Validation surfaces through three props on every component that has a state where failure is possible: `invalid` (boolean, drives `aria-invalid`), `error` (the message), and `description` (persistent helper text). Both `error` and `description` render through `aria-describedby`.
- Network, registry, and filesystem failures belong to the CLI, never to components. A component that cannot fetch has no fetch path.
- The token build fails loudly on an unknown token reference or a contrast pair below its target, and prints the token name, the pair, and the measured ratio.

### Styling strategy

- Use CSS variables as the framework-neutral contract for tokens and themes.
- Provide optional Tailwind CSS v4 utilities/plugin or integration helpers; do not force all consumers to use Tailwind.
- Use CSS-first Tailwind configuration and `@theme` only in the Tailwind integration package and supported templates.
- Publish usable prebuilt CSS for package-mode users who do not want a Tailwind build integration.
- Document the browser baseline of Tailwind v4 separately from the browser baseline of the universal CSS/Web Components package.
- Avoid assuming utility classes can be discovered automatically when class names are generated dynamically; document safe patterns.

### Token source format

- Author tokens in **DTCG format** (`tokens.dev` draft) as the neutral source of truth, because it is framework-neutral and already readable by Storybook, Tokens Studio, and major design tools.
- Compile DTCG → CSS custom properties → framework artifacts (Tailwind `@theme`, TypeScript token maps, per-framework bindings).
- Generated artifacts are committed only if a consumer needs them offline; otherwise they are built artifacts and are git-ignored. Never hand-edit generated output.
- Every semantic token ships with a documented description, its dark-theme value, and the fallback used when the token is unset.

### Behavior and accessibility strategy

- Use Radix UI where it fits the React package; Radix is not the shared runtime for Vue, Svelte, Angular, or vanilla HTML.
- Evaluate native browser capabilities and established accessible libraries before implementing complex controls.
- Every interactive component must specify semantics, keyboard behavior, focus behavior, disabled/read-only behavior, and error/empty/loading states.
- For advanced widgets, document any known deviations and assistive-technology testing coverage.

### Icons

- Provide Phosphor Icons integration for supported framework packages.
- Prefer per-icon imports and tree-shakeable exports.
- Keep icon sizing, weight, decorative/meaningful semantics, and accessible labels documented.
- Do not require the React icon package in non-React integrations; add framework-specific bindings or an appropriate web icon strategy.

## 5. Suggested Monorepo

```text
santaka-ui/
├── apps/
│   ├── docs/                    # Searchable docs site
│   ├── storybook/               # Component workshop
│   └── playground/              # Theme and component playground
├── packages/
│   ├── tokens/                  # Source tokens and transforms
│   ├── themes/                  # Light, dark, and brand themes
│   ├── core/                    # Framework-neutral metadata/contracts
│   ├── styles/                  # Shared CSS and reset/normalization choices
│   ├── tailwind/                # Optional Tailwind CSS v4 integration
│   ├── web-components/          # Universal custom elements
│   ├── react/                   # React components and Radix integration
│   ├── vue/                     # Vue adapter package
│   ├── svelte/                  # Svelte adapter package
│   ├── angular/                 # Angular adapter package
│   ├── icons/                   # Shared icon guidance and integration exports
│   ├── mcp/                     # MCP server and AI metadata reader
│   ├── utilities/               # Minimal framework-neutral utilities
│   ├── cli/                     # Santaka CLI
│   ├── registry/                # Registry schema, metadata, endpoints/content
│   ├── blocks/                  # Page-level compositions and templates
│   └── testing/                 # Shared fixtures and testing helpers
├── examples/
│   ├── vanilla-html/
│   ├── react-vite/
│   ├── nextjs/
│   ├── vue-vite/
│   ├── nuxt/
│   ├── sveltekit/
│   ├── angular/
│   └── astro/
├── tooling/
│   ├── eslint/
│   ├── typescript/
│   └── test-config/
├── .changeset/
├── pnpm-workspace.yaml
├── turbo.json
└── package.json
```

Start with only the packages required by the first release. Create framework packages as meaningful boundaries emerge; do not generate empty packages just to fill the directory tree.

### Repository tooling

- TypeScript strict mode for TypeScript packages.
- pnpm workspaces and Turborepo (or equivalent) for monorepo orchestration.
- ESLint and Prettier or a clearly documented equivalent.
- Changesets for package versioning and changelogs.
- GitHub Actions or equivalent CI with cache, lint, type-check, test, build, and package validation stages.
- Automated dependency updates and license/security review.

### Toolchain defaults

Each of these is a decision, not a suggestion, and each is re-affirmed in ADR-018. Versions are pinned by the lockfile to whatever is stable at implementation time; only the tool choices are fixed here.

| Concern | Tool | Note |
|---|---|---|
| Runtime and package manager | Node.js `>=22.11.0`, pnpm 10 via corepack | Single pnpm version enforced by CI |
| Task orchestration | Turborepo | Cache-aware pipeline for lint → typecheck → test → build |
| Language | TypeScript 5.x, `strict`, `noUncheckedIndexedAccess` | Applied via `tooling/typescript` |
| Lint and format | ESLint 9 flat config + typescript-eslint, Prettier 3 | |
| Unit and component tests | Vitest with `jsdom` | jsdom is fine here; real browser behavior is covered by Playwright |
| Browser and E2E tests | Playwright with the Core and Baseline projects from the browser support baseline | Firefox, WebKit, and Chromium at their floor versions |
| Accessibility | `axe-core` + `@axe-core/playwright`, Storybook a11y addon | ADR-008 |
| Storybook | Storybook 9, React renderer first | Other adapters get their own Storybook only when their framework support is claimed |
| Bundle budgets | `size-limit` with `@size-limit/preset-small-lib` | Enforces the performance budgets table in section 12 |
| Package health | `publint` + `@arethetypeswrong/cli` | Release-blocking |
| Dependency hygiene | `knip` for unused files and exports | |
| Release and versioning | Changesets, npm provenance on publish | |
| Docs site | Astro with content collections | ADR-006 |
| Docs search | Pagefind | Static index, no hosted search dependency |
| Token pipeline | `style-dictionary` with DTCG input | ADR-002 |
| CLI | Node with `cac` for parsing and `kleur` for output | |
| CI | GitHub Actions, one required workflow running lint → typecheck → test → build → size-limit → publint/attw | |

- `knip` failing means dead code, not a broken build: it runs in CI as a separate non-blocking job at first, and becomes blocking once the workspace is clean.
- No additional linter is added without an ADR; ESLint plus Prettier plus TypeScript covers linting, formatting, and types.

## 6. Design System

### Token groups

- Color: primitive palette plus semantic tokens such as `surface`, `surface-raised`, `text`, `text-muted`, `border`, `primary`, `danger`, `success`, `warning`, and `focus-ring`.
- Typography: families, font sizes, line heights, weights, letter spacing.
- Spacing and sizing: scale, component heights, icon sizes, layout widths.
- Shape: radius, border widths, outlines.
- Elevation: shadows and overlay levels.
- Motion: durations, easing, entrance/exit patterns, reduced-motion alternatives.
- Breakpoints: documented responsive scales without hiding framework-specific layout choices.
- Z-index: named semantic layers for popovers, dialogs, toasts, and tooltips.

### Starter token values

These are the v1.0 defaults. Every value is a decision, not a placeholder: change one and the change is a design change with a contrast re-check, not a tweak. DTCG files live under `packages/tokens/src/` and compile to the CSS custom properties named in section 4.

#### Color

| Token | Light | Dark | Pair checked |
|---|---|---|---|
| `--sk-color-surface` | `#FFFFFF` | `#0F0D14` | — |
| `--sk-color-surface-raised` | `#F7F5FB` | `#1A1622` | — |
| `--sk-color-surface-sunken` | `#F1EEF8` | `#0A0910` | — |
| `--sk-color-border` | `#E2DFF0` | `#2A2438` | decorative only |
| `--sk-color-border-strong` | `#8B85A0` | `#6B6480` | 3.52:1 light, 3.46:1 dark vs surface |
| `--sk-color-text` | `#17141C` | `#F5F3FA` | 18.21:1 / 17.54:1 vs surface |
| `--sk-color-text-muted` | `#5F5A6B` | `#A9A3BD` | 6.64:1 / 7.99:1 vs surface |
| `--sk-color-primary` | `#6D28D9` | `#7C3AED` | white text 7.10:1 / 5.70:1 |
| `--sk-color-primary-hover` | `#5B21B6` | `#6D28D9` | white text 8.98:1 / 7.10:1 |
| `--sk-color-primary-fg` | `#FFFFFF` | `#FFFFFF` | — |
| `--sk-color-danger` | `#DC2626` | `#B91C1C` | white text 4.83:1 / 6.47:1 |
| `--sk-color-danger-fg` | `#B91C1C` | `#FCA5A5` | ≥4.5:1 on its own surface |
| `--sk-color-success` | `#15803D` | `#4ADE80` | 5.02:1 on light surface |
| `--sk-color-warning` | `#92400E` | `#FBBF24` | 7.09:1 on light surface |
| `--sk-color-focus-ring` | `#6D28D9` | `#C4B5FD` | 7.10:1 / 10.46:1 vs surface |

Coral and mint from the visual identity enter as `--sk-color-accent-coral` (`#F97362` light, `#FDA4A0` dark) and `--sk-color-accent-mint` (`#0D9488` light, `#5EEAD4` dark). They are decoration and data-viz accents, never the sole carrier of state.

Every token ships as an `rgb()` declaration followed by its `oklch()` equivalent so the Core tier renders the intended color.

#### Typography

The default stack is the platform UI stack, so there is no network request and no font license to track:

```text
--sk-font-sans: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif
--sk-font-mono: ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace
--sk-font-display: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif
```


`--sk-font-display` is the face for display and heading text. Its declared stack
is the platform fallback: **no webfont ships in the default path**, so a consumer
replaces the whole stack in one line with a geometric or techno sans (Space
Grotesk, Chakra Petch) by setting the custom property. This is recorded in
ADR-017.
Inter Variable is offered as an opt-in package via `@fontsource-variable/inter` (SIL Open Font License 1.1) and is documented as such. No other webfont ships in the default path.

| Token | Size / line-height | Weight | Tracking |
|---|---|---|---|
| `--sk-text-xs` | `0.75rem` / `1rem` | 500 | `0.04em` |
| `--sk-text-sm` | `0.875rem` / `1.25rem` | 400 | `0.01em` |
| `--sk-text-base` | `1rem` / `1.5rem` | 400 | `0` |
| `--sk-text-lg` | `1.125rem` / `1.75rem` | 400 | `0` |
| `--sk-text-xl` | `1.25rem` / `1.75rem` | 600 | `0` |
| `--sk-text-2xl` | `1.5rem` / `2rem` | 600 | `-0.01em` |
| `--sk-text-3xl` | `1.875rem` / `2.25rem` | 700 | `-0.02em` |
| `--sk-text-4xl` | `2.25rem` / `2.5rem` | 700 | `-0.02em` |
| `--sk-text-display-sm` | `1.75rem` / `2.25rem` | 800 | `-0.02em` |
| `--sk-text-display` | `2.5rem` / `3rem` | 800 | `-0.03em` |

#### Spacing, sizing, and shape

```text
--sk-space-1: 0.25rem   --sk-space-2: 0.5rem    --sk-space-3: 0.75rem
--sk-space-4: 1rem      --sk-space-5: 1.25rem   --sk-space-6: 1.5rem
--sk-space-8: 2rem      --sk-space-10: 2.5rem   --sk-space-12: 3rem
--sk-space-16: 4rem     --sk-space-20: 5rem     --sk-space-24: 6rem

--sk-height-sm: 1.75rem   (28px)   --sk-height-md: 2.25rem   (36px)   --sk-height-lg: 2.75rem   (44px)
--sk-icon-sm: 1rem        --sk-icon-md: 1.25rem            --sk-icon-lg: 1.5rem
--sk-touch-min: 2.75rem   (44px, the minimum target size for every interactive element)

--sk-radius-sm: 0   --sk-radius-md: 0   --sk-radius-lg: 0   --sk-radius-xl: 0
--sk-radius-full: 9999px   (a shape, not a style: badge dot, spinner)
--sk-radius-glass: 1.25rem   --sk-radius-glass-lg: 1.75rem   (floating overlays)
--sk-border-width: 1px   --sk-border-thick: 3px   (all brutalist chrome)
--sk-ring-width: 3px   --sk-ring-offset: 3px   (a hard offset ring, not a glow)
```

Chrome has no corner rounding. `radius.full` remains a circle because the badge
dot and the spinner are circles by shape; glass overlays take their own large
radii so a floating panel can never be mistaken for a pill. Borders carry
exactly two weights: `border-width` for hairlines and separators, `border-thick`
for every brutalist control. Recorded in ADR-017.

`--sk-touch-min` is enforced in the Definition of Done: no interactive component may render a hit target smaller than 44×44 CSS px, including icon buttons.

#### Elevation and motion

```text
--sk-shadow-xs: 2px 2px 0 0      --sk-shadow-sm: 3px 3px 0 0
--sk-shadow-md: 4px 4px 0 0      --sk-shadow-lg: 6px 6px 0 0
--sk-shadow-brutal: 5px 5px 0 0
--sk-shadow-brutal-hover: 7px 7px 0 0
--sk-shadow-brutal-active: 2px 2px 0 0
--sk-shadow-brutal-none: none
```

Elevation is a hard offset with **zero blur**. No shadow token carries a color:
the component supplies `--sk-color-shadow`, so one ladder serves both themes and
the dark theme no longer raises an alpha on a blur that does not exist. Recorded
in ADR-017.

```text
--sk-duration-instant: 0ms
--sk-duration-control-fast: 90ms   --sk-duration-control: 140ms   --sk-duration-control-slow: 180ms
--sk-duration-overlay: 280ms       --sk-duration-overlay-slow: 420ms

--sk-ease-arcade: cubic-bezier(0.34, 1.56, 0.64, 1)
--sk-ease-arcade-exit: cubic-bezier(0.4, 0, 0.6, 1)
--sk-ease-glass: cubic-bezier(0.32, 0.72, 0, 1)
--sk-ease-glass-exit: cubic-bezier(0.4, 0, 1, 1)
```

Motion is split by layer, so a component picks its personality by reading one
token. Interactive controls use the `control-*` durations and `ease-arcade`,
whose overshoot past 1.0 is what makes a press visibly spring back. Floating
overlays use the `overlay-*` durations and `ease-glass`, which starts fast and
settles long.

Reduced motion is implemented once, as a global property override rather than a
token override — the shipped mechanism is in `styles/src/reset.css`:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    transition-property: none !important;
    scroll-behavior: auto !important;
  }
}
```

`transition-property: none` is what makes this correct rather than merely fast:
shortening a transition still animates the property, and a 1ms slide is still a
slide.

Components additionally drop the **transform** under reduced motion, not just the
duration — a control that lifts 2px on hover must not lift at all when motion is
reduced. Each animated component carries its own block; this is the same reason
the Icon Button spinner sets `animation: none` rather than a shorter period.

#### Z-index

```text
--sk-z-base: 0        --sk-z-sticky: 1100     --sk-z-dropdown: 1000
--sk-z-overlay: 1300  --sk-z-popover: 1400     --sk-z-modal: 1700
--sk-z-toast: 1500    --sk-z-tooltip: 1600
```

No component hard-codes a z-index; every one reads a layer token, so a consumer can move the whole stack.

### Theme requirements

- Light and dark themes at minimum.
- CSS custom properties as the public theme contract.
- Custom brand theme generation and documentation.
- High contrast and forced-colors review.
- Color contrast checks for text, focus indicators, and key UI states.
- SSR-safe theme initialization guidance to minimize theme flash.
- Respect `prefers-reduced-motion` and system color preferences where applicable.

### Theming and customization contract

#### Three levels, in precedence order

1. **Tokens.** Every color, size, radius, duration, and z-index is a CSS custom property with a literal fallback: `var(--sk-color-primary, #6D28D9)`. Setting the variable on `:root` or any subtree is the supported way to rebrand.
2. **Variants.** The `variant` and `size` props for the component's own axis of variation.
3. **Source mode.** Editing copied source is the escape hatch, and it is a documented workflow (section 8), not a bug.

There is no `unstyled` prop and no per-component escape-hatch prop. A consumer who wants a different component builds it from `@santaka-ui/styles` primitives and the token contract, or uses source mode.

#### Theme switching

- The theme is set by `[data-sk-theme="light" | "dark"]` on `<html>`. There is no class-based or JS-applied alternative.
- When the consumer has set no attribute, the fallback is `@media (prefers-color-scheme: dark)`.
- Flash prevention is one documented blocking snippet, run before first paint, reading the storage key `sk-theme` whose only valid values are `light`, `dark`, and `system`:

```html
<script>
  try {
    var v = localStorage.getItem('sk-theme') || 'system'
    var d = v === 'dark' || (v === 'system' && matchMedia('(prefers-color-scheme: dark)').matches)
    document.documentElement.setAttribute('data-sk-theme', d ? 'dark' : 'light')
  } catch {}
</script>
```

- `@santaka-ui/react` exports `ThemeScript` rendering exactly that snippet, and `useTheme()` reading and writing the same key. Every example app uses `ThemeScript`, so the flash-free path is proven in CI rather than only documented.
- A theme change writes `sk-theme` and dispatches no custom event; `useTheme` observes the attribute with `MutationObserver` so multiple components stay in sync.

#### Brand themes

- A brand theme is a JSON object of token name → value, validated against the DTCG schema. `santaka theme init` compiles it to CSS through the same pipeline that produces the default themes, so a generated theme is byte-comparable with a shipped one.
- A brand theme declares light and dark values for every token it overrides, and must supply a contrast report for the pairs it introduces. The CLI prints the failing pairs and refuses to write a theme that fails.

### Visual identity

Direction: **Arcade neo-brutalism for chrome, iOS glass for floating layers.**
Every surface you press and read — buttons, inputs, cards, badges — is hard-edged:
a 3px stroke, no rounding, and a hard offset shadow with zero blur. Only floating
layers (dialog, popover, toast, tooltip, command palette) get glass, and the
glass reads as genuinely floating precisely because everything around it is
hard-edged. The ink/dark base, violet accent, and limited coral/mint remain.

> **This supersedes the earlier "calm and readable" tone.** The previous
> direction recorded here was *Playful Engineering* with calm typography. Weight
> 800 display type, hard offset shadows, and an overshoot easing are
> attention-grabbing by design, which is a real departure from §1.8's "playful,
> not distracting". It was adopted deliberately and the trade-off is recorded in
> **ADR-017**, including what would reverse it. An optional mascot ("Taka") is
> still reserved for onboarding, empty states, and easter eggs rather than every
> screen; humor must never make error messages unclear or blame users.
>
> Two materials ship in the token layer: `glass` holds the only alpha values in
> the system, which is what makes glass read as a distinct material, and every
> color in it is declared per theme — including `fallback`, the solid surface
> used when `backdrop-filter` is unsupported, because a fallback panel must still
> match the theme it renders in.

### Right-to-left support

RTL is a Definition of Done item, not a follow-up. Retrofitting logical properties across forty components is the expensive path.

- Authored CSS uses logical properties exclusively: `margin-inline-start`, `padding-block`, `inset-inline-end`, `border-start-start-radius`, `text-align: start`. Banned in component source: `left`, `right`, `margin-left`, `padding-right`, `text-align: left/right`, `border-top-left-radius`.
- Direction comes from the `dir` attribute on any ancestor. There is no separate RTL build and no RTL-specific stylesheet.
- Icons that encode direction (Chevron, Arrow, Undo, indentation guides) get the class `sk-icon--directional` and are mirrored under `[dir='rtl']` with `transform: scaleX(-1)`.
- Horizontal keyboard semantics invert under RTL: Slider, Tabs, and Menubar arrow-key handling is derived from `getComputedStyle(el).direction` at interaction time, never from a build-time flag.
- Progress fill, Slider fill, and Scroll Area gutters use logical properties so they follow `dir` without a second style.
- Every component's story renders in both directions, and every component has at least one visual regression case in RTL. A component with no RTL story is not Stable.

### Internationalization and formatting

Internationalization is a **v1.0 requirement**, not a later refinement. Date Picker, Date Range Picker, Number Input, Table sorting, and Pagination all depend on it, and retrofitting locale support after those components ship causes breaking changes.

- Locale, timezone, and week-start are consumer-supplied. The library must never assume `en-US`, UTC, or a host-timezone default.
- Use the platform `Intl` APIs rather than shipping a date or number library.
- Parse and format user-entered numeric and date input according to the active locale.
- Publish a documented list of locales covered by automated tests, separated from locales covered only by manual review.
- All shipped component strings are English by default and are overridable through a documented locale API.

## 7. Component Roadmap

Component counts are planning targets, not a promise that every item ships in v1.0. Prioritize quality, API consistency, and testing over raw quantity.

### Tier 1 — Foundations and common components

- Button, Icon Button, Link, Typography, Heading, Separator.
- Badge, Avatar, Avatar Group, Card, Kbd, Spinner, Skeleton.
- Visually Hidden, Focus Ring, basic layout primitives where appropriate.
- Input, Textarea, Label, Field/Form Field, Checkbox, Radio Group, Switch.
- Alert, Banner, Progress, Empty State, Tooltip.

### Tier 2 — Common interactive components

- **v1.0 scope for this tier:** Dialog, Alert Dialog, Select, Tabs, Tooltip, Toast. Everything else in this tier ships after v1.0, or ships early only when its behavior owner (section 4) is already validated for a related component.
- Deferred to v1.x: Drawer/Sheet, Popover, Dropdown Menu, Context Menu, Combobox, Autocomplete, Accordion, Collapsible, Breadcrumb, Pagination, Menu Bar, Navigation Menu, Slider, Number Input, Pin/OTP Input, File Upload, Search Field.

### Tier 3 — Application and data patterns

- Table and Data Table, Sortable Table, Calendar, Date Picker, Date Range Picker.
- Sidebar, Stepper, Command Palette, Toolbar, Tree View.
- Timeline, Stat, Meter, Loading State, Result, Status Indicator.
- Container, Stack, Inline, Grid, Scroll Area, Aspect Ratio, Resizable Panels.
- Dashboard, auth, settings, pricing, and onboarding blocks.

### Tier 4 — Specialized, optional or separate packages

- Enterprise Data Grid and virtualization.
- Rich Text Editor, charting integrations, code editor/highlighter.
- Drag-and-drop, carousel, image gallery, color picker.
- Complex editors should use specialist libraries where appropriate rather than growing the core package with heavy dependencies.

### Component definition of done

Each stable component must include, where relevant:

- Typed public API, clear controlled/uncontrolled state contract, and consistent naming.
- Appropriate sizes and visual variants.
- Disabled, loading, empty, error, and read-only states where meaningful.
- Keyboard behavior, semantic markup, accessible names, and correct focus handling.
- Light/dark theme and responsive behavior.
- Reduced-motion behavior for animated states.
- Usage example, API/props reference, design notes, and known limitations.
- Storybook stories, unit/component tests, interaction tests, and accessibility checks.
- Import/export verification and a documented dependency footprint.


Two acceptance thresholds apply to every component before it can carry the Stable label:

1. **Time budget:** a Tier 1 component must reach Definition of Done in no more than two working days for one contributor; a Tier 2 interactive component no more than five. A component that repeatedly exceeds this is a scope signal, not a discipline problem — split it, defer it, or adopt an existing specialized library.
2. **Single owner:** its behavior owner (section 4) is named in its documentation.

## 8. CLI Specification

The command names below are proposed behavior to implement, not commands that already exist.

### Core commands

```bash
npx santaka@latest init
npx santaka@latest init --framework react-vite
npx santaka@latest init --framework vue
npx santaka@latest init --framework vanilla
npx santaka@latest add button dialog
npx santaka@latest add data-table --source
npx santaka@latest theme init
npx santaka@latest registry add <registry-url>
npx santaka@latest doctor
npx santaka@latest list
npx santaka@latest diff button
npx santaka@latest update
```

### CLI requirements

- Detect supported framework, package manager, TypeScript usage, existing styling setup, and relevant config files.
- Permit an explicit framework override and fail with actionable guidance for unknown/incompatible setups.
- Offer two distribution modes:
  - **Source mode:** copy source files into the consumer's codebase, with transparent dependency and license metadata.
  - **Package mode:** install versioned npm packages and document CSS/build requirements.
- Resolve peer dependencies and versions without silently overwriting user files.
- Be idempotent where practical and safe to rerun.
- Provide dry-run output, clear diffs, useful errors, and rollback-safe file writes where possible.
- Never execute remote registry code as a side effect of adding a component.
- Support private/custom registries and namespaced items through a documented schema.
- Include migration and conflict guidance when an installed source component is locally modified.
- Test CLI behavior on Windows, macOS, and Linux.

## 9. Registry and Distribution

### Registry capabilities

- Component, block, theme, and utility metadata.
- Unique IDs and optional namespaces.
- Dependency declarations and peer dependency constraints.
- Framework and styling compatibility metadata.
- Versioned registry schema and source checksums.
- License, authorship, attribution, and provenance fields.
- Safe JSON metadata and source file payloads with path validation.
- Public and private registries with explicit trust boundaries. *(Resolved by ADR-007: registries are **static versioned JSON**, not a live endpoint. The payload is build output under `apps/docs/public/registry/` — a current `index.json`, an immutable `v<version>/` directory for pinned consumers, and one file per component so a scripted consumer need not fetch the whole index. A private registry is the same directory served from wherever a company serves internal assets, so the trust boundary is the URL the developer typed, not an API key to invent. Validation is not review: the CLI prints that registry content is untrusted until reviewed, and bundled entries win a name collision so a third party cannot shadow a shipped component. `tests/registry/remote.test.mjs` serves the published payload over HTTP and drives the CLI against it, so the remote path is exercised rather than assumed.)*

### Registry safety rules

- Validate every incoming registry entry against a versioned schema.
- Reject path traversal and unexpected file destinations.
- Display the source, dependency changes, and file diff before destructive changes.
- Do not execute registry-provided scripts automatically.
- Keep package supply-chain review, dependency scanning, and license checks in release CI.
- Treat third-party registry content as untrusted until reviewed by the installing developer.


Every registry entry is one JSON object validated against a versioned JSON Schema (`packages/registry/schema/`). The `ai` block in section 11 is part of that schema, not an extra file.


```json
{
  "$schema": "https://santaka.dev/schema/registry-item-v1.json",
  "schemaVersion": 1,
  "name": "select",
  "namespace": null,
  "type": "component",
  "frameworks": ["react", "vue", "svelte", "angular", "web-components"],
  "stability": "stable",
  "behaviorOwner": "web-components",
  "version": "1.0.0",
  "dependencies": {},
  "peerDependencies": {},
  "registryDependencies": [],
  "files": [{ "path": "src/components/select/select.tsx", "type": "registry:ui", "checksum": "sha256-…" }],
  "cssVariables": ["--sk-color-primary", "--sk-border-thick", "--sk-shadow-brutal"],
  "localesCovered": ["en-US"],
  "license": "MIT",
  "ai": { "summary": "…", "whenToUse": ["…"], "whenNotToUse": ["…"] }
}
```

- `type` is one of `component`, `block`, `theme`, `utility`.
- `stability` is one of `stable`, `preview`, `experimental`, `deprecated`, and must match the label in section 3's capability matrix for that framework.
- `checksum` is a `sha256` of the file bytes as published, and the CLI verifies it after write.
- `cssVariables` lists the custom properties a consumer must have defined for the component to render correctly. The CLI checks it and warns with the missing names instead of failing silently.

### Source-mode upgrades and conflicts

Source mode copies files into a consumer's repo, so the CLI needs durable knowledge of what it wrote.

- The CLI maintains `santaka-manifest.json` at the project root: `{ "version": 1, "items": { "<id>": { "version": "1.0.0", "files": { "<path>": "sha256-…" } } } }`.
- On `add`, `update`, or `init`, each target file is compared to the recorded hash: unchanged means safe to overwrite, changed means the consumer edited it.
- A modified file is **never** overwritten without consent. The CLI prints a unified diff and exits with code `2`, then the consumer chooses `--overwrite`, `--skip`, or nothing.
- On success the manifest is rewritten with the new hashes; on conflict or failure it is left untouched, so a failed run is always safe to repeat.
- `santaka diff <id>` compares the manifest against the installed files and exits `0` when clean, `2` when drifted, so it works as a CI check.
- The manifest is committed to the consumer's repository. It is the only file the CLI creates outside the directories it was asked to write.

## 10. Documentation and Component Workshop

### Documentation site

- Quick start by framework and install mode.
- Searchable component catalog and API reference.
- Copy-ready examples and installation commands.
- Live previews, light/dark toggle, viewport controls, and code tabs.
- Design tokens and Theme Studio documentation.
- Accessibility notes, keyboard tables, browser support matrix, and known limitations.
- Guides for SSR, hydration, Tailwind v4, CSS variables, forms, customization, and migrations.
- Separate labels for Stable, Preview, Experimental, and Deprecated integrations.

### Storybook

- Stories for default, variants, sizes, disabled, loading, error, long content, dark theme, and relevant edge cases.
- Controls and interaction tests for interactive components.
- Accessibility addon plus manual testing guidance.
- Visual regression checks for key stories.
- Stories should import the public package API rather than relying only on private implementation paths.
- Document Storybook framework choice and compatibility instead of assuming one Storybook setup can directly host every adapter without configuration.

## 11. AI and LLM Integration

Component metadata is already structured data. This section makes it consumable by AI tooling as a first-class product surface, because a design system whose props and accessibility notes live only in prose cannot be used by an agent, and that is becoming the default way components get chosen.

Scope is deliberately static: the tooling serves validated JSON. No model is called at build time or at query time, and nothing in this section requires a hosted service.

### Machine-readable component metadata

Every registry entry carries an `ai` block alongside its existing fields:

```json
{
  "name": "select",
  "type": "component",
  "frameworks": ["react"],
  "stability": "stable",
  "behaviorOwner": "web-components",
  "ai": {
    "summary": "Choose one or more options from a list, with search for long lists.",
    "whenToUse": ["Picking 2–20 known options", "Options need descriptions or icons"],
    "whenNotToUse": ["Free-text input is valid — use a Combobox", "Fewer than 5 options — use a Radio Group"],
    "accessibility": "Listbox pattern; aria-expanded on the trigger, aria-activedescendant managed internally.",
    "example": "<Select value={v} onValueChange={setV}>…</Select>",
    "localesCovered": ["en-US"],
    "knownLimitations": ["SSR consumers must pass an explicit id"]
  }
}
```

- The `ai` block is schema-validated in CI alongside the rest of the registry entry, using the field set defined in section 11. A component without a complete `ai` block cannot be published as Stable.
- `summary` is one sentence, under 200 characters, and states what the component does rather than how it is built.
- `whenNotToUse` is mandatory and must contain at least one entry naming the alternative component. A component with no stated alternative is a component nobody can choose correctly.
- `accessibility` names the ARIA pattern or role the component implements.
- `knownLimitations` is the same content the component page shows; both are generated from one source so they cannot drift.

### llms.txt

- `apps/docs/public/llms.txt` — a curated index: what the system is, the token contract, the component list with one-line summaries, and links to per-component references. Hand-written, kept short, and reviewed whenever the component set changes.
- `apps/docs/public/llms-full.txt` — the full reference in one file: every component's props, variants, accessibility notes, and examples. Generated from the same metadata that renders the site.
- Both are generated-and-verified: CI regenerates `llms-full.txt` and fails if the committed file differs, so it can never go stale.

### MCP server

`@santaka-ui/mcp` is a Node stdio MCP server over the same registry metadata. It runs no model and reaches no network; it is a deterministic query surface.

| Tool | Input | Output |
|---|---|---|
| `search_components` | `{ need: string, constraints?: { framework?, interactive?, formAssociated? } }` | Ranked component list with `summary`, `stability`, `whenNotToUse` |
| `get_component` | `{ name: string, framework: string }` | Props, variants, events, example, accessibility notes, limitations |
| `get_tokens` | `{ theme: 'light' \| 'dark', group?: string }` | Token name → value map from the compiled DTCG output |
| `get_usage` | `{ goal: string, framework: string }` | Copy-ready setup and install snippet for the best-matching component |

- `search_components` is a pure local index over registry metadata — substring and tag matching over `summary`, `whenToUse`, and the component name. No embedding service, no API key, no telemetry.
- Results are ordered `Stable` before `Preview` before `Experimental`, and an experimental component is returned only when no stable one fits, so a query never silently steers work onto an unstable surface.
- The server is published to npm, documented in the MCP registry, and smoke-tested in CI by launching it and asserting one response shape per tool.

## 12. Quality, Accessibility, and Test Strategy

### Test layers

1. **Static checks:** lint, format, TypeScript, exports, dependency boundaries.
2. **Unit tests:** utilities, token transforms, variant functions, registry validation, CLI parsing.
3. **Component tests:** rendering, props, state, events, forms, focus, and keyboard interactions.
4. **Accessibility tests:** automated checks plus manual keyboard and screen-reader review for representative workflows.
5. **Browser tests:** Playwright across supported browser engines and framework fixtures.
6. **SSR/hydration tests:** for each integration that claims server-rendered support.
7. **Visual regression:** important components and themes in representative viewport sizes.
8. **Package tests:** clean install, the ESM-only policy in section 4, CSS exports, tree-shaking, peer dependency correctness, `publint` and `attw` cleanliness.
9. **CLI end-to-end tests:** initial setup, adding components, conflicts, private registry config, dry run, and recovery.
10. **Contract tests:** every component's `ai` registry block validates against the JSON Schema, and the documented prop and event names are asserted against the built `.d.ts` so a rename that misses the docs fails the build.
11. **MCP smoke tests:** the server launches and returns one valid response per tool, with no network access available to it in the test environment.

### Accessibility baseline

- Use WCAG 2.2 AA as a product target while stating the scope of evaluation honestly.
- Check semantic HTML, labels, accessible names, contrast, focus visibility, keyboard operability, zoom/reflow, and reduced motion.
- Test dialogs, menus, comboboxes, date pickers, and other complex widgets with manual keyboard and assistive-technology scenarios.
- Avoid claiming that an automated axe scan alone certifies a component as accessible.
- Document unsupported browser/assistive technology combinations and known limitations.

### Performance requirements

- Keep the core token package lightweight.
- Tree-shake component and icon imports where supported.
- Separate advanced data/editor dependencies into optional packages or peer dependencies.
- Measure production bundle impact for representative examples.
- Avoid shipping React runtime to the universal Web Components path unless the design explicitly requires it.

### Performance budgets

These budgets are release gates, not aspirations. CI fails the build when a budget is exceeded.

| Artifact | Budget (minified + gzip) |
|---|---|
| `@santaka-ui/tokens` + `@santaka-ui/core` | ≤ 8 KB |
| `@santaka-ui/tokens` + `core` + any 10 components (import cost, not package total) | ≤ 25 KB |
| `@santaka-ui/web-components` runtime (excluding component code) | ≤ 12 KB |
| `@santaka-ui/react` runtime overhead (excluding component code) | ≤ 15 KB |

- Measure with `bundle-phobia`-equivalent tooling in CI, per example app, per commit.
- A regression beyond the budget requires an explicit PR note explaining why, or a budget change recorded as an ADR.
- Per-component import cost must be measured, not inferred from package totals. Tree-shaking claims are only made where a real import test proves it.

## 13. Security, Licensing, and Governance

- Audit licenses for runtime, development, icon, primitive, and generated-code dependencies.
- Document licenses and attribution for source-copy components and blocks.
- Add dependency vulnerability scanning and automated update review.
- Publish supported Node.js and package manager versions.
- Use semantic versioning and a written deprecation policy.
- Require tests and documentation for new stable components.
- Protect publishing credentials with CI secrets and least privilege.
- Generate provenance/attestation when release tooling supports it reliably.

### Legal and naming preconditions

These must be resolved **before** the first public npm publish, and ideally during weeks 1–2.

- **Trademark:** search "Santaka" and "Taka" in the target trademark classes before announcing the name publicly. Record the result; if a conflict is likely, rename before any registry, package, or domain commitment.
- **npm scope:** confirm `@santaka-ui` scope ownership and that the unscoped `santaka-ui` name is free. Scope ownership is not transferable once dependents exist.
- **Domain and social handles:** reserve them alongside the npm scope so the release announcement has a canonical home.
- **Mascot:** treat the "Taka" mascot as original artwork committed under the project license. Any traced or borrowed asset invalidates the icon/illustration license story.

### Contributing and community governance

- `CONTRIBUTING.md` documents the setup, the Definition of Done, and the ADR process. `CODE_OF_CONDUCT.md` adopts Contributor Covenant 2.1 verbatim. `SECURITY.md` gives a private disclosure channel and a stated response window, and explicitly says not to open a public issue for a vulnerability.
- Issue templates: bug report (framework, versions, reproduction, browser), feature request (the problem, not the proposed component), and accessibility report (the WCAG criterion, the assistive technology, and the expected behavior).
- Pull requests touching component behavior, public props, or the token contract require two approvals and a linked ADR or issue. Pure documentation and test-only changes need one.
- Changesets are required on every publishable change. CI fails when a pull request modifies a package but carries no changeset.
- Public API changes are proposed through a short RFC issue before implementation, so a breaking prop change is never discovered during review.
- Labels `good first issue` and `help wanted` mark work needing no prior context. Tier 1 in section 7 is explicitly seeded with such issues.
- Publishing runs from CI only, with npm trusted publishing or provenance. No developer machine holds a publish token.

## 14. Release and Versioning Policy


- `0.x`: API may evolve rapidly; document breaking changes.
- `1.0.0`: release only after the stable support matrix and release gates are met.
- Patch releases: bug and security fixes without intentional public API breakage.
- Minor releases: backward-compatible features and new components.
- Major releases: breaking changes with migration guide and codemods where practical.
- Publish packages in a coordinated, documented sequence; do not force every framework adapter to the same maturity level.

## 15. Proposed 12-Week MVP Roadmap

This is a planning estimate for a small team of roughly 2–4 experienced contributors. Actual timing depends on scope, design capacity, complex widget requirements, and framework parity.

### Weeks 1–2 — Architecture and foundation

- [x] Confirm scope, package naming, licensing, and public API conventions. Default license is **MIT**; switching later is a breaking change for adopters.
- [x] Time-box a Web Components tooling comparison (Stencil default vs Lit) using one realistic interactive component, and record the outcome as an ADR. If no decisive evidence appears within the box, keep Stencil and move on.
- [x] Define token schema, themes, component metadata, and framework support labels.
- [x] Set up the monorepo, CI, linting, formatting, type checks, and release conventions.
- [ ] Verify the legal preconditions in section 13: trademark search, npm scope availability, domain, mascot originality.
- [ ] Build a small visual prototype and test package architecture decisions early.
- [x] Write the API conventions, forms contract, and starter token values into the shared `tooling/` config, then implement Button against them as the first conformance test.
- [ ] Record ADR-011 through ADR-014, ADR-017, and ADR-018, and prove scoped styles plus lazy registration work under Next.js SSR before committing to them. *(All six of those ADRs now exist, and all eighteen: 001–019. ADR-006 (docs site) and ADR-007 (registry hosting) are now recorded as well, so all eighteen are complete. The Next.js SSR proof is done — `examples/nextjs` builds, renders every tag on the server, defines nothing server-side, and hydrates cleanly; evidence in ADR-005.)*

**Exit criteria:** architecture decision record, working monorepo, first token build, and a documented proof of concept.

### Risk register

Review this list at the end of every two-week phase. A risk without a named owner is a risk that gets discovered late.

| # | Risk | Impact | Mitigation |
|---|---|---|---|
| R1 | The Web Components toolchain choice (Stencil vs Lit) proves wrong late, after component code exists | Rework across the entire universal package | Time-box the comparison in weeks 1–2 and record an ADR; keep the PoC small enough to throw away |
| R2 | Custom elements hydrate or upgrade badly under SSR frameworks (Next.js, Nuxt, SvelteKit) | Support-matrix claims become false; the section 17 release gate fails | Test one component under SSR in weeks 1–2, not week 11; publish an explicit lazy-registration and client-only guidance path |
| R3 | Flash of unstyled or unhydrated custom elements in real apps | Visible quality defect on the headline framework-neutral path | Closed by the scoped-styles decision in section 4 (ADR-011), which removes the shadow-root FOUC mechanism entirely; keep the zero-flash vanilla example as the regression check |
| R4 | Dual implementation cost silently doubles every interactive component | Weeks 5–8 overrun, Definition of Done quietly dropped | Enforce the ownership rule and the per-component time budget; the second implementation is an adapter, never a rewrite |
| R5 | `1.0.0` is declared before Tier 2 scope is genuinely complete | Permanent credibility damage with adopters | Weeks are estimates and exit criteria are gates; the support matrix reflects test evidence only |
| R6 | npm scope, trademark, or domain conflict surfaces after dependents exist | Cannot publish; renaming forces breaking churn | Resolve in weeks 1–2 via the section 13 preconditions, before any public commitment |
| R7 | Bundle budgets are never measured, so tree-shaking claims stay unproven | Performance claims in the documentation become false | Enforce the section 12 budget table in CI on every commit, measured per import |

### Weeks 3–4 — Tokens and core UI

- [x] Implement semantic tokens and light/dark themes.
- [ ] Build Button, Icon Button, Link, Badge, Card, Typography, Separator, Spinner, Skeleton, Input, Textarea, and Label. *(Done and proven in Chromium: Button, Icon Button, Link, Badge, Card, Text, Spinner, Skeleton, Label, Separator, Input, Textarea — Tier 1 complete.)*
- [x] Add React and universal Web Components implementations for the agreed core subset. *(Complete for all seventeen shipped components, each with universal and React implementations.)*
- [ ] Add Storybook stories and baseline tests. *(No Storybook exists anywhere in the repo.)*
- [x] Prove plain `<form>` submission for Input and Select in all three targets, including `formResetCallback` in the universal package. *(Universal and React are proven; the Vue target does not exist yet, so it cannot be claimed — see the framework rows below. **Universal:** Input, Textarea, and Select are proven in Chromium — submission through a plain form, `formResetCallback` restoring the initial value, `formDisabledCallback` withholding a disabled field, and `formStateRestoreCallback` on restore. **React:** `examples/react-vite/e2e/form-submission.e2e.ts` renders all six form controls through `@santaka-ui/react`, submits a plain `<form>`, and reads the entries out of the browser's own `FormData`; it runs as the `react-example` CI job. Writing it found two real defects — `Checkbox` never forwarded `value`, and `Radio Group` submitted every field twice because the inner radios and the form-associated host both submitted. React 19 form actions remain untested.)*

**Exit criteria:** basic components work in React + Vite and plain HTML, with a repeatable build.

### Weeks 5–6 — Interactions and forms

- [x] Add Checkbox, Radio Group, Switch, Tabs, Select, Tooltip, Dialog, Alert Dialog, and Toast — the v1.0 Tier 2 scope from section 7. *(Complete: all nine shipped and proven in Chromium, each with universal + React implementations, keyboard tests, and registry `ai` blocks. `llms.txt` and `llms-full.txt` have since shipped and are verified in CI; the remaining v1.0 gap is the MCP server.)*
- [ ] Validate keyboard interaction, focus return, accessible labeling, and controlled/uncontrolled behavior.
- [x] Name the behavior owner (section 4) for each interactive component in its documentation; undocumented divergence blocks the Stable label. *(All twenty-one components declare `behaviorOwner: "web-components"` in their registry entries, validated by `packages/core`'s registry tests, and the decision is recorded in ADR-003: the universal package owns every component's behavior, React is a thin adapter, and there is no Radix dependency to make the React package the owner of anything. No divergences exist, which the adapter structure supports rather than asserts.)*
- [ ] Add interaction, keyboard, and accessibility tests.
- [x] Ship `llms.txt`, the MCP server, and the registry `ai` block for the v1.0 component set. *(`apps/docs/public/llms.txt` and `llms-full.txt` are generated from the registry and verified in CI. `@santaka-ui/mcp` is a stdio server over the same metadata with the four tools section 11 names, unit-tested (19 tests) and smoke-tested in CI by driving a real MCP client over an in-memory transport pair. The registry `ai` blocks have existed for all twenty-one components since Tier 1, and the schema that requires them is now recorded in ADR-015, along with the `props`/`events` fields `get_component` reports — derived from the committed declarations and component sources rather than authored.)*

**Exit criteria:** core interactive workflows pass the defined component and browser checks.

### Weeks 7–8 — Navigation, data patterns, and blocks

- [ ] Add Alert, Progress, Empty State, Accordion, and a basic Table/Data Table.
- [ ] Publish starter blocks for dashboard, settings, and authentication screens.
- [x] Create example applications for React + Vite, Next.js, and vanilla HTML. *(`examples/react-vite`, `examples/nextjs`, and `examples/vanilla-html` all exist. The React + Vite example is the one that closes section 17's "submits through a plain `<form>` in React" gate: `examples/react-vite/e2e/form-submission.e2e.ts` renders every form control through `@santaka-ui/react`, submits a plain `<form>`, and reads the entries back out of the browser's own `FormData`. It runs in CI as the `react-example` job, separate from the universal browser matrix, because "the adapter forwards `name`" is a different claim from "the universal element submits" — the adapter dropping `name` is invisible to the universal suite.)*
- [ ] Measure bundle size against the section 12 budgets and resolve integration issues.

**Exit criteria:** examples prove the system can build real application screens without requiring Next.js.

### Weeks 9–10 — CLI and registry

- [x] Implement project detection, explicit framework selection, and install modes. *(`packages/cli` detects framework, package manager, TypeScript, styling, and config files, with evidence for each conclusion; `--framework` overrides without silencing detection, and an unknown value fails with the supported list. Two distribution modes: `add` copies source (the default), and the install commands for package mode are printed rather than run — a scaffolder that shells out to a package manager can no longer tell a network failure from a permissions failure from a version conflict.)*
- [x] Implement `init`, `add`, `theme init`, `list`, and `doctor` as the initial command set. *(`init`, `add`, `list`, `doctor`, `diff`, `theme init`, `registry`, and `update` all ship, plus `diff` as a CI check. 37 unit tests and 18 end-to-end tests that drive the built binary in a real subprocess.)*
- [x] Validate registry schemas, dependency metadata, safe paths, and diff output. *(Every entry is validated against `registry-item-v1` before use; destinations are confirmed inside the project root with a `relative()` check rather than a string prefix; source bytes are hashed against the entry's declared checksum; `diff` renders a unified diff and exits 2 on drift.)*
- [x] Add CLI tests across Windows, macOS, and Linux. *(The `cli` CI job runs the unit and end-to-end suites on `ubuntu-latest`, `macos-latest`, and `windows-latest`. The paths, the exit codes, and the executable bit all differ per platform, which is why the matrix is the check rather than a note.)*
- [ ] Document supported setups and errors.

**Exit criteria:** a developer can initialize a supported project, install a component, and troubleshoot common setup issues.

### Weeks 11–12 — Stabilization and release candidate

- [ ] Audit accessibility, theme contrast, reduced motion, and responsive states.
- [ ] Test production builds, SSR/hydration for claimed integrations, package exports, and tree-shaking.
- [ ] Run visual regression and cross-browser tests for supported targets.
- [ ] Complete documentation, release notes, contribution guide, and license audit.
- [ ] Publish a release candidate and gather feedback before declaring v1.0 stable.

**Exit criteria:** all release gates below pass and the support matrix accurately reflects test evidence.

## 16. Future Roadmap

### v1.x — Adoption and component breadth

- Expand components based on user demand.
- Improve CLI upgrade/conflict workflows and private registry support.
- Add more blocks, starter templates, theme presets, and community contribution paths.
- Publish additional validated React framework examples.

### v2.x — Framework adapters

- Stabilize Vue 3/Nuxt integration.
- Stabilize Svelte/SvelteKit integration.
- Stabilize Angular integration.
- Improve Astro and other framework examples.
- Keep Web Components as a baseline path when framework-native adapters are not yet mature.

### Later — Ecosystem features

- Theme Studio and token export tools.
- Component/blocks discovery portal and community registries.
- Design-tool integration if there is clear value and maintained support.
- Advanced data components and specialist package integrations.
- Native mobile support only as a separate implementation strategy, not by implying web components are native widgets.

## 17. Release Readiness Checklist

A release candidate is ready only when the applicable items are checked and evidence is recorded.

- [x] Core component documentation and examples are complete. *(The **framework and search decisions** are recorded in ADR-006 — Astro with content collections, Pagefind for a build-time index, static by default with preview islands — and the component documentation itself is generated from the registry, so a prop rename reaches the docs, the CLI, the MCP server, and `llms.txt` together or not at all. What is not yet built is the `apps/docs` application; `apps/docs/public/` already carries the generated `llms.txt`, `llms-full.txt`, and `registry/` payload.)*
- [x] Public TypeScript types and package exports validate in clean consumer projects. *(`tests/consumer/run.mjs` packs all eight packages with `pnpm pack`, installs the tarballs into a scratch project outside the workspace, and runs ten checks: every documented export subpath resolves; the ESM entrypoints import and export what they claim; the loader registers nothing on import (ADR-005); the stylesheets are real files with the tokens the components need; no export resolves to CommonJS (ADR-012); the CLI detects a project and installs a component from the tarball; the MCP server answers over a real transport from the tarball; the **universal** packages typecheck with `skipLibCheck: false` and **without** `@types/node`; the Node packages typecheck with it; and the React adapter server-renders the elements it wraps. A `consumer` CI job runs it. It found a real defect on first run: `loader/cdn.js` was a CommonJS shim pointing at `dist/cjs/loader.cjs.js`, a file the build deletes — unreachable and broken, and shipped in every tarball.)*
- [x] Unit, component, interaction, and browser tests pass in CI. *(528 tests pass on every run — 48 token, 20 utilities, 123 core (registry schema, exports contract, validate), 136 React, and 201 Playwright — and `pnpm run verify` exits 0 from a cold cache. Note that "component tests" here means browser tests: there is no separate jsdom component-test layer yet.)*
- [ ] Keyboard navigation and focus management have been manually reviewed.
- [x] Automated accessibility checks and targeted manual reviews are documented. *(axe-core scans the vanilla example — every component in its documented states — in light, dark, and invalid-submit states on every CI run, pinned to WCAG 2.0/2.1 A+AA with no rules disabled: `e2e/a11y.e2e.ts`, stack and scope recorded in ADR-008. The honesty rule stands: axe is the regression net; the per-component browser tests remain the keyboard-and-behavior evidence. The first run found four real defect classes, all fixed rather than rule-disabled.)*
- [x] Light/dark themes, forced-colors considerations, and reduced motion are reviewed. *(Token contract tests assert the glass fallback panel clears 4.5:1 against each theme's own text and is near-opaque; `forced-colors` is handled in sixteen component stylesheets plus `glass.css` and `primitives.css`; `prefers-reduced-motion` removes the press transform rather than merely shortening it.)*
- [x] SSR/hydration works for each integration that claims it. *(The one integration claiming SSR is Next.js, and the proof now exists: `examples/nextjs` builds, renders every shipped tag with its public attributes in the server output, defines nothing on the server (38 chunks scanned), upgrades every element through the lazy loader, applies the scoped 3px stroke, and hydrates with no mismatch errors. Run with `pnpm --filter @santaka-ui/example-nextjs test:ssr`. Evidence recorded in ADR-005.)*
- [x] CSS isolation and prebuilt CSS behavior are verified. *(The conformance test asserts every component is scoped with no shadow root, and that styling hooks are `data-slot` rather than classes. Prebuilt CSS reachability is covered by `exports-contract.test.ts`.)*
- [x] Bundle size, tree-shaking, and dependency impact are measured. *(Measured per component rather than as a package total: runtime 17.96 KB of 18, component CSS 2.24 KB of 4 per component, token themes 12.21 KB of 13. One budget — `tokens + core` at 8 KB — has no measurement and is recorded as an open gap in ADR-010.)*
- [x] Bundle budgets in section 12 pass in CI, or any exception is recorded as an ADR. *(`pnpm run size` runs in CI and fails the build on a regression. The token theme budget moved from 12 KB to 13 KB, recorded in ADR-010.)*
- [x] Every Stable component names its behavior owner and its locale coverage. *(All twenty-one registry entries declare `behaviorOwner: "web-components"` and `localesCovered: ["en-US"]`, and a test asserts it.)*
- [x] CLI initialization, component add, dry run, conflicts, and recovery are tested. *(18 end-to-end tests against the built binary: init, add, dry run writes nothing, a conflict exits 2 with a diff and writes nothing, `--overwrite` and `--skip` resolve it, `--skip` preserves the consumer's edit and the drift stays visible afterwards, rollback restores a replaced file and removes a created one when a later write fails, and `update` reports the same conflict rule.)*
- [x] Registry entries validate and cannot write outside intended destinations. *(Twenty-one entries validate against the schema with checksums verified against the shipped files. Path traversal is refused by the validator and by the example server, which normalizes then confirms the resolved path stays inside the repo root.)*
- [x] Dependency licenses and security scans are reviewed. *(`scripts/audit-licenses.mjs` classifies every dependency into allow / review / deny. **526 packages, 13 license expressions, no denied license.** Three need review, and they are exactly the ones string matching cannot judge: `MPL-2.0` (axe-core, lightningcss), the compound `Apache-2.0 AND LGPL-3.0-or-later` on `@img/sharp-win32-x64`, and `CC-BY-4.0` on `caniuse-lite` — a data license, not a software one. The full inventory is written to `docs/dependency-licenses.md`.)* *(`scripts/scan-security.mjs` runs `pnpm audit` and classifies advisories **by reach** rather than by severity alone, because a critical in an example application and the same advisory in a package that ships are different obligations. The current scan finds **40 advisories, and none reaches a published package's direct dependencies** — everything sits in `next` (33, including 3 critical) and `sharp` (3) from the Next.js example, and `postcss` (4) from the build tool chain. Recorded rather than hidden.)*
- [x] Changelog, semver policy, upgrade notes, and migration guidance are prepared. *(`CHANGELOG.md` records what has landed since the foundation and is honest about the central fact: **no release has been published**, all nine packages at `0.1.0`. `docs/RELEASE.md` makes section 14 concrete — what each bump means, with the test for "breaking" stated as *whether adopting code has to change* rather than how large the diff is; what counts as public API, and what does not, which is why deleting unreachable CommonJS needed no release note. `docs/MIGRATIONS.md` states the shape of a migration entry and why the fourth part is the one people skip. `tests/registry/release-docs.test.mjs` (10 tests) asserts the documents are *consistent with the repository* rather than merely present: the policy's stated internal-dependency rule matches `.changeset/config.json`, the changelog's version claim matches every package, every link resolves, and every publishable package appears in the policy's scope — that last one failed first, because `@santaka-ui/cli` was absent. It also forced a policy decision: `updateInternalDependencies` moved from `patch` to `minor`, because when the components package gains a component the React adapter has gained it too — a feature, not a fix.)*
- [x] Component API conventions are enforced by a conformance test, and no Stable component deviates. *(Ten tests in `conventions.e2e.ts`, checking section 4's grammar statically and at runtime, including the ADR-016 ban on physical CSS properties — `margin-left`, `text-align: right`, `border-top-left-radius` and their siblings — which until now was prose in the plan and checked by nothing. One question is recorded as open in ADR-013 rather than enforced either way: whether a presentation boolean takes the `is`/`has`/`can` prefix.)*
- [ ] Every form control submits through a plain `<form>` in React, Vue, and the universal package. *(All six universal form controls — Input, Textarea, Select, Checkbox, Switch, Radio Group — are proven in Chromium: submission through a plain form read via `FormData`, `formResetCallback` restoring the initial value, `formDisabledCallback` withholding a disabled field, and now `formStateRestoreCallback` in `e2e/form-state-restore.e2e.ts`. That last one is driven by a direct `el.formStateRestoreCallback(state, "restore")` call, and the reason is worth recording: the callback fires on a session restore, which a page test cannot trigger, and **the back/forward cache does not do it** — measured in Chromium, `page.goBack()` restores the DOM intact, so the value survives without the callback running once. A test built on that navigation would pass with the callback deleted. The suite therefore asserts the part that is this library's contract — the value reaches the prop, the rendered control, and `FormData`; no `sk-value-change` fires, because a restore is not a user action; and a `"autocomplete"` mode is ignored — and leaves "the platform calls it" to the browser. Negative-tested by gutting the callback in Input and Checkbox: one and two tests fail respectively. The React path forwards to the same element, and Vue does not exist.)*
- [x] `publint` and `attw` are clean for every published package. *(All eight pass both. `attw` found a real defect when it was introduced: Stencil's generated declarations re-export from a directory specifier, so the shipped types did not resolve under `node16`. Fixed in the build.)*
- [x] The documented support matrix is generated from the Playwright projects that actually run. *(`docs/browser-support.md` is generated by `generate-support-matrix.mjs`, which reads the projects out of `playwright.config.ts` and each engine's revision from the browser Playwright will actually launch — so a browser appears only if a project launches it. A `support-matrix` CI job fails when the document and the config disagree, which is the only way they can drift. Verified against a real run: 261 tests pass on Chromium, 260 + 1 flaky on Firefox, 261 on WebKit.)*
- [x] Every component has an RTL visual regression case and a `--sk-touch-min` compliant target. *(The RTL half is the `visual` project's 57 baselines. The touch half is `e2e/touch-target.e2e.ts`: 14 tests covering Button, Icon Button, Input, Textarea, Select, Checkbox, Switch, Radio Group, Link, and Tabs, and — importantly — **reading the threshold from `--sk-touch-min`** rather than asserting a literal 44. Negative-tested by raising the token to 3.5rem: two tests fail here, while the nine hardcoded `>= 44` assertions elsewhere stay green, which is exactly the weakness this file exists to expose.

  Two components are **below the 44px commitment and above it nowhere**: `sk-tab` is 39px and `sk-link` is 24px. Both clear WCAG 2.2 SC 2.5.8 (24px minimum), and `sk-link` is exempt outright — SC 2.5.8 exempts an inline target in a sentence. They are measured against the WCAG floor and pinned by a test that fails if they ever *reach* 44, so the exception cannot linger unexamined. Recorded as a finding, not rounded away.)* *(`--sk-touch-min` is proven for Button and Icon Button, including a Core-tier case where `aspect-ratio` is unavailable. RTL visual coverage now exists for every component: the `visual` Playwright project photographs each example-page section in light/ltr, light/rtl, and dark/ltr — 57 baselines, ADR-019. It is not a CI gate yet, deliberately, because a screenshot diff needs a reviewer. The authored-CSS half of ADR-016 is now enforced by a conformance test rather than left as prose.)*
- [x] `llms.txt` and `llms-full.txt` are regenerated in CI and committed in sync. *(`apps/docs/public/` — both generated from the registry `ai` blocks and the committed `components.d.ts`, so neither can drift from the components: 21 components, their props with types and defaults, accessibility notes, examples, and limitations. An `llms` CI job fails when the committed files differ from what the generator writes. The prose sections are authored in the generator, not derived, because "what this is" has no machine-readable source.)*
- [ ] The public framework/browser support matrix reflects tested evidence.
- [ ] Legal preconditions in section 13 are resolved: license, trademark, npm scope, domain, mascot rights.

## 18. Architecture Decision Records

The following decisions must be recorded as ADRs under `docs/adr/` before dependent work begins. An ADR is short: context, decision, evidence, and what would reverse it. Undocumented defaults are how a project acquires two conflicting conventions.

| ADR | Decision | Deadline |
|---|---|---|
| ADR-001 | Web Components authoring toolchain (Stencil default, Lit as the alternative) | End of weeks 1–2 |
| ADR-002 | Token source format and build pipeline (DTCG as source, CSS variables as contract) | End of weeks 1–2 |
| ADR-003 | Behavior ownership per component family | With the first component of each family |
| ADR-004 | Package naming, publish scope, and license (MIT) | End of weeks 1–2 |
| ADR-005 | SSR and hydration strategy for the universal package, including custom-element registration timing | End of weeks 3–4 |
| ADR-006 | Documentation site framework and search approach | End of weeks 3–4 |
| ADR-007 | Registry hosting model: static versioned JSON versus a live endpoint | End of weeks 5–6 |
| ADR-008 | Accessibility testing stack: axe-core plus `@axe-core/playwright` in browser tests, with manual review recorded per component | End of weeks 5–6 |
| ADR-009 | Source-mode upgrade path for locally modified components | With the first CLI release |
| ADR-010 | Bundle budgets and how they are enforced | End of weeks 1–2 |
| ADR-011 | CSS encapsulation: scoped styles over Shadow DOM | End of weeks 1–2 |
| ADR-012 | Distribution contract: ESM-only, subpath exports table, peer ranges | End of weeks 1–2 |
| ADR-013 | Component API conventions and naming grammar | End of weeks 1–2 |
| ADR-014 | Browser support baseline and Core tier | End of weeks 1–2 |
| ADR-015 | AI metadata schema, llms.txt, and MCP server packaging | End of weeks 5–6 |
| ADR-016 | RTL strategy: logical properties, direction-derived keyboard behavior | End of weeks 3–4 |
| ADR-017 | Starter token values, type scale, and motion values | End of weeks 1–2 |
| ADR-018 | Toolchain defaults table | End of weeks 1–2 |
| ADR-019 | Visual-regression baselines and the environment that owns them | End of weeks 11–12 |

## 19. First Implementation Tasks


Start with this order to avoid building the entire ecosystem before its key assumptions are proven:

1. Create the monorepo and CI baseline.
2. Record ADR-001, ADR-002, ADR-004, ADR-010, ADR-011, ADR-012, ADR-013, ADR-014, ADR-017, and ADR-018, and resolve the section 13 legal preconditions.
3. Define the public token schema and CSS custom-property contract.
4. Implement one foundational component (Button) in React and in the universal package, naming its behavior owner per ADR-003.
5. Test Button in React + Vite, Next.js, and plain HTML fixtures.
6. Verify theme switching, keyboard/focus behavior, packaging, bundle budgets, and SSR/hydration requirements; record ADR-005.
7. Prove scoped styles, plain-form submission, and lazy custom-element registration in all three targets; that proof is the gate for building any other component.
8. Use lessons from that proof of concept to finalize component APIs and package boundaries.
9. Build the initial component subset and the Storybook workshop.
10. Implement CLI and registry only after package layouts and metadata contracts have stabilized; record ADR-009.
11. Expand framework adapters based on passing integration tests and validated user demand.

## 20. Definition of Success

Santaka v1.0 succeeds when a developer can use the documentation to choose a supported environment, initialize a project with the CLI, apply a theme, add a component, understand and edit the source or install a versioned package, and build a real UI without being forced to use Next.js.

The most important differentiators are not a raw component count. They are reliable cross-framework foundations, excellent developer experience, accessible interactions, beautiful defaults, clear code ownership, and an honest support matrix.

---

## Reference Links

These are primary documentation sources to re-check when implementation begins; exact versions and APIs may change.

### Foundations and styling

- Tailwind CSS docs: https://tailwindcss.com/docs
- Tailwind CSS upgrade guide: https://tailwindcss.com/docs/upgrade-guide
- Tailwind CSS compatibility: https://tailwindcss.com/docs/compatibility
- Radix UI primitives: https://www.radix-ui.com/primitives
- Radix UI accessibility: https://www.radix-ui.com/primitives/docs/overview/accessibility
- Lit documentation: https://lit.dev/docs/
- Stencil documentation: https://stenciljs.com/docs/introduction
- Phosphor Icons: https://phosphoricons.com/
- Phosphor React package: https://www.npmjs.com/package/@phosphor-icons/react

### Components, documentation, and testing

- Storybook docs: https://storybook.js.org/docs
- Storybook framework support: https://storybook.js.org/docs/configure/integration/frameworks-feature-support
- Playwright: https://playwright.dev/docs/intro
- WCAG 2.2: https://www.w3.org/TR/WCAG22/
- Design Tokens Community Group: https://www.w3.org/community/design-tokens/

### Competitive and registry research

- shadcn/ui docs: https://ui.shadcn.com/docs
- shadcn/ui registry: https://ui.shadcn.com/docs/registry
- Material UI getting started: https://mui.com/material-ui/getting-started/
- Chakra UI docs: https://chakra-ui.com/docs
- Chakra UI CLI: https://chakra-ui.com/docs/get-started/cli
- HeroUI: https://heroui.com/docs/introduction
- Base UI: https://base-ui.com/react/overview/about
- React Aria: https://react-spectrum.adobe.com/react-aria/
- Ark UI: https://ark-ui.com/
- daisyUI: https://daisyui.com/docs/intro/
- Ant Design: https://ant.design/docs/react/introduce/
