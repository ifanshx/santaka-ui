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
      "--sk-color-primary",
      "--sk-color-primary-hover",
      "--sk-color-primary-fg",
      "--sk-color-text",
      "--sk-color-surface-raised",
      "--sk-color-surface-sunken",
      "--sk-color-border-strong",
      "--sk-touch-min",
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
      "--sk-color-primary",
      "--sk-color-primary-hover",
      "--sk-color-primary-fg",
      "--sk-color-text",
      "--sk-color-surface-raised",
      "--sk-color-border-strong",
      "--sk-color-danger",
      "--sk-icon-sm",
      "--sk-icon-md",
      "--sk-icon-lg",
      "--sk-touch-min",
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
