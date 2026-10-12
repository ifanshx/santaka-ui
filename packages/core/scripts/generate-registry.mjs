/**
 * Generate the registry metadata for the shipped components.
 *
 * The `ai` block on every entry is the product surface an agent reads to choose
 * a component (section 11). Hand-writing it once per component would guarantee
 * it drifts from the code; generating the mechanical parts and requiring the
 * prose parts keeps both honest.
 *
 * Checksums are computed from the published files, so a registry entry that
 * claims a version is verified against the bytes actually shipped.
 */
import { createHash } from "node:crypto"
import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const here = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(here, "..", "..", "..")
const wcRoot = join(repoRoot, "packages", "web-components")
const outDir = join(repoRoot, "packages", "core", "registry")

const version = JSON.parse(readFileSync(join(wcRoot, "package.json"), "utf8")).version

const sha256 = (path) => `sha256-${createHash("sha256").update(readFileSync(path)).digest("hex")}`

const wcFile = (tag, extension) => join(wcRoot, "src", "components", tag, `${tag}.${extension}`)

/**
 * The component set. Everything mechanical — files, checksums, CSS variables —
 * is derived; only the prose below is authored, and it is the part a consumer
 * actually reads.
 */
const COMPONENTS = [
  {
    name: "button",
    tag: "sk-button",
    stability: "stable",
    cssVariables: [
      "--sk-border-thick",
      "--sk-color-border-strong",
      "--sk-color-danger",
      "--sk-color-focus-ring",
      "--sk-color-primary",
      "--sk-color-primary-fg",
      "--sk-color-shadow",
      "--sk-color-surface-raised",
      "--sk-color-text",
      "--sk-touch-min",
      "--sk-duration-control",
      "--sk-duration-control-fast",
      "--sk-ease-arcade",
      "--sk-ease-arcade-exit",
      "--sk-ring-offset",
      "--sk-ring-width",
      "--sk-shadow-brutal",
      "--sk-shadow-brutal-active",
      "--sk-shadow-brutal-hover",
      "--sk-shadow-brutal-none",
    ],
    ai: {
      summary: "Triggers an action: submit a form, open a dialog, save a change.",
      whenToUse: [
        "The control performs an action on the current page",
        "It submits or resets a form",
        "It opens a panel, dialog, or menu",
      ],
      whenNotToUse: [
        "It navigates somewhere — use a Link instead",
        "It toggles a value on its own, with no action — use a Checkbox or Switch",
        "It is the only option in a set — use a Radio Group",
      ],
      accessibility:
        "Button role. Activates on Enter and Space. A loading button is aria-busy rather than disabled, so it keeps its accessible name and position in the tab order.",
      example: '<sk-button variant="primary">Save changes</sk-button>',
      knownLimitations: [
        'As a form-associated custom element, `type="submit"` calls form.requestSubmit() explicitly; native implicit submission does not apply',
      ],
    },
  },
  {
    name: "icon-button",
    tag: "sk-icon-button",
    stability: "stable",
    cssVariables: [
      "--sk-border-thick",
      "--sk-color-border-strong",
      "--sk-color-danger",
      "--sk-color-focus-ring",
      "--sk-color-primary",
      "--sk-color-primary-fg",
      "--sk-color-shadow",
      "--sk-color-surface-raised",
      "--sk-color-text",
      "--sk-touch-min",
      "--sk-duration-control",
      "--sk-duration-control-fast",
      "--sk-duration-control-slow",
      "--sk-ease-arcade",
      "--sk-ease-arcade-exit",
      "--sk-icon-sm",
      "--sk-icon-md",
      "--sk-icon-lg",
      "--sk-radius-full",
      "--sk-ring-offset",
      "--sk-ring-width",
      "--sk-shadow-brutal",
      "--sk-shadow-brutal-active",
      "--sk-shadow-brutal-hover",
      "--sk-shadow-brutal-none",
    ],
    ai: {
      summary:
        "A square, icon-only control for actions that need no label, such as edit or delete.",
      whenToUse: [
        "The action is unambiguous from a well-known icon",
        "Space is tight, such as a toolbar or a table row",
        "The control sits next to a labelled control that implies the group",
      ],
      whenNotToUse: [
        "The action is not obvious from the icon alone — use a Button with a label",
        "It is the primary or most common action on the page — use a Button",
        "It performs navigation — use a Link instead",
      ],
      accessibility:
        "Button role with an explicit accessible name from the required `label` prop. The slotted icon is aria-hidden because it carries no information the name does not. A missing label warns in development.",
      example:
        '<sk-icon-button label="Delete item"><svg><!-- trash icon --></svg></sk-icon-button>',
      knownLimitations: [
        "The `label` prop is required in the React types but only warns in plain HTML",
      ],
    },
  },
  {
    name: "link",
    tag: "sk-link",
    stability: "stable",
    cssVariables: [
      "--sk-color-primary",
      "--sk-color-primary-hover",
      "--sk-color-focus-ring",
      "--sk-color-text-muted",
    ],
    ai: {
      summary: "Navigates to another URL, in place or in a new tab.",
      whenToUse: [
        "It changes the URL",
        "The destination is a document or page",
        "It can be opened in a new tab or copied by the reader",
      ],
      whenNotToUse: [
        "It performs an action without changing the URL — use a Button instead",
        "It downloads a file rather than navigating — pass `download`",
        "It triggers a dialog or menu — use a Button",
      ],
      accessibility:
        "Native anchor role, so middle-click, open-in-new-tab, and copy-link work. `external` sets target=_blank with rel=noopener noreferrer and renders a decorative indicator.",
      example: '<sk-link href="/docs">Read the docs</sk-link>',
      knownLimitations: [
        "An empty `href` renders as visibly disabled rather than failing at build time",
      ],
    },
  },
  {
    name: "badge",
    tag: "sk-badge",
    stability: "stable",
    cssVariables: [
      "--sk-border-thick",
      "--sk-color-border-strong",
      "--sk-color-danger",
      "--sk-color-danger-fg",
      "--sk-color-danger-subtle",
      "--sk-color-primary",
      "--sk-color-primary-fg",
      "--sk-color-shadow",
      "--sk-color-success",
      "--sk-color-success-fg",
      "--sk-color-success-subtle",
      "--sk-color-surface",
      "--sk-color-surface-sunken",
      "--sk-color-text",
      "--sk-color-text-muted",
      "--sk-color-warning",
      "--sk-color-warning-fg",
      "--sk-color-warning-subtle",
      "--sk-radius-full",
      "--sk-shadow-sm",
    ],
    ai: {
      summary: "A static label for status, category, or count. It is not interactive.",
      whenToUse: [
        "It marks a record's state, such as Active, Pending, or Failed",
        "It labels a category or count that must stand out from body copy",
        "It marks an item in a dense list where state has to stay scannable",
      ],
      whenNotToUse: [
        "It is clickable — use a Button, because a badge has no interaction",
        "It navigates — use a Link instead",
        "It carries a value the reader selects — use a Checkbox or Switch instead",
      ],
      accessibility:
        "Static text, so it exposes no role and no tab stop. Each variant sets a foreground and a background measured together, so the label clears 4.5:1 against its own fill rather than only against the page. The dot variant would otherwise convey state by color alone, which WCAG 1.4.1 forbids, so it renders the consumer-supplied `statusLabel` visually hidden instead.",
      example: '<sk-badge variant="success">Active</sk-badge>',
      knownLimitations: [
        "The `statusLabel` prop is required in the React types for the `dot` variant but only warns in plain HTML",
      ],
    },
  },
  {
    name: "input",
    tag: "sk-input",
    stability: "stable",
    cssVariables: [
      "--sk-border-thick",
      "--sk-color-border-strong",
      "--sk-color-danger",
      "--sk-color-danger-fg",
      "--sk-color-focus-ring",
      "--sk-color-shadow",
      "--sk-color-surface",
      "--sk-color-surface-sunken",
      "--sk-color-text",
      "--sk-color-text-muted",
      "--sk-duration-control",
      "--sk-duration-control-fast",
      "--sk-ease-arcade",
      "--sk-ease-arcade-exit",
      "--sk-font-sans",
      "--sk-icon-sm",
      "--sk-ring-offset",
      "--sk-ring-width",
      "--sk-shadow-brutal",
      "--sk-shadow-brutal-active",
      "--sk-shadow-brutal-none",
      "--sk-space-1",
      "--sk-space-2",
      "--sk-space-3",
      "--sk-space-4",
      "--sk-text-base-line-height",
      "--sk-text-base-size",
      "--sk-text-lg-size",
      "--sk-text-sm-line-height",
      "--sk-text-sm-size",
      "--sk-text-sm-weight",
      "--sk-text-xs-line-height",
      "--sk-text-xs-size",
      "--sk-text-xs-weight",
      "--sk-touch-min",
    ],
    ai: {
      summary:
        "A single-line text field that participates in a plain HTML form. Validation is the browser's, not this component's.",
      whenToUse: [
        "The value is a short string: a name, an email, a handle, a search term",
        "It must submit through a plain `<form>` with no JavaScript state",
        "The browser's own constraint validation is wanted rather than a bespoke rules engine",
      ],
      whenNotToUse: [
        "The value is long-form text — use a Textarea",
        "The value is one of a fixed set — use a Select or Radio Group",
        "It only toggles a boolean — use a Checkbox or Switch",
      ],
      accessibility:
        "Renders a real native `<input>`, so the browser supplies constraint validation, password managers, autofill, and IME composition rather than this component reimplementing them. `label`, `description`, and `error` are wired through `<label for>` and `aria-describedby`; an error also sets `aria-invalid` and renders an icon beside its text, never color alone (WCAG 1.4.1). `readOnly` keeps the value submitted and focusable, which is what distinguishes it from `disabled`.",
      example: '<sk-input name="email" type="email" label="Email" required></sk-input>',
      knownLimitations: [
        "The generated `id` for the inner control differs from React's `useId()`, so an SSR consumer must pass an explicit `id` for a separately-rendered `Label` to find it (section 4, forms contract)",
        "The `pattern` prop takes a string, not a RegExp, because it becomes a native attribute",
      ],
    },
  },
]

for (const component of COMPONENTS) {
  const files = [
    { extension: "tsx", type: "registry:component" },
    { extension: "css", type: "registry:style" },
  ].map(({ extension, type }) => ({
    path: `src/components/${component.tag}/${component.tag}.${extension}`,
    type,
    checksum: sha256(wcFile(component.tag, extension)),
  }))

  const entry = {
    $schema: "https://santaka.dev/schema/registry-item-v1.json",
    schemaVersion: 1,
    name: component.name,
    namespace: null,
    type: "component",
    frameworks: ["react", "vue", "svelte", "angular", "web-components"],
    stability: component.stability,
    behaviorOwner: "web-components",
    version,
    dependencies: {},
    peerDependencies: {},
    registryDependencies: [],
    files,
    cssVariables: component.cssVariables,
    localesCovered: ["en-US"],
    license: "MIT",
    ai: { ...component.ai, localesCovered: ["en-US"] },
  }

  mkdirSync(outDir, { recursive: true })
  writeFileSync(join(outDir, `${component.name}.json`), `${JSON.stringify(entry, null, 2)}\n`)
  console.log(`[registry] wrote ${component.name}.json (${files.length} files)`)
}

console.log(`[registry] ${COMPONENTS.length} components at version ${version}`)
