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
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import {
  eventsFor,
  propsFor,
  readComponentTypes,
  readEventMetadata,
} from "./lib/component-types.mjs"

const here = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(here, "..", "..", "..")
const wcRoot = join(repoRoot, "packages", "web-components")
const outDir = join(repoRoot, "packages", "core", "registry")

const version = JSON.parse(readFileSync(join(wcRoot, "package.json"), "utf8")).version

const sha256 = (path) => `sha256-${createHash("sha256").update(readFileSync(path)).digest("hex")}`

const wcFile = (dir, tag, extension) =>
  join(wcRoot, "src", "components", dir, `${tag}.${extension}`)

// The public surface — props and events — is read from the committed type
// declarations and component sources rather than authored per entry, so it
// cannot drift from the components. `get_component` (section 11) reports it.
const componentTypes = readComponentTypes(join(wcRoot, "src", "components.d.ts"))
const eventMetadata = readEventMetadata(join(wcRoot, "src", "components", "shared"))

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
  {
    name: "textarea",
    tag: "sk-textarea",
    stability: "stable",
    cssVariables: [
      "--sk-border-thick",
      "--sk-color-border-strong",
      "--sk-color-danger",
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
      "--sk-text-base-line-height",
      "--sk-text-base-size",
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
        "A multi-line text field that participates in a plain HTML form, for text too long to type on one line.",
      whenToUse: [
        "The value runs to several lines: a bio, a comment, release notes, an address",
        "The consumer wants the browser to size the field by line count",
        "It must submit through a plain `<form>` with no JavaScript state",
      ],
      whenNotToUse: [
        "The value is a single short string — use an Input",
        "The value is one of a fixed set — use a Select or Radio Group",
        "It only toggles a boolean — use a Checkbox or Switch",
      ],
      accessibility:
        "Renders a real native `<textarea>`, so the browser supplies constraint validation and the error bubble rather than this component reimplementing them. `label`, `description`, and `error` are wired through `<label for>` and `aria-describedby`; an error sets `aria-invalid` and renders an icon beside its text, never color alone (WCAG 1.4.1). The field resizes vertically by default, because long-form text is edited rather than typed in one line. Shares its form contract with Input.",
      example: '<sk-textarea name="bio" label="Bio" rows="4"></sk-textarea>',
      knownLimitations: [
        "There is no `pattern` prop: a textarea has no single-line grammar for a pattern to constrain",
        "The generated `id` for the inner control differs from React's `useId()`, so an SSR consumer must pass an explicit `id` for a separately-rendered `Label` to find it (section 4, forms contract)",
      ],
    },
  },

  {
    name: "checkbox",
    tag: "sk-checkbox",
    stability: "stable",
    cssVariables: [
      "--sk-border-thick",
      "--sk-color-border-strong",
      "--sk-color-danger",
      "--sk-color-focus-ring",
      "--sk-color-primary",
      "--sk-color-primary-fg",
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
      "--sk-ring-offset",
      "--sk-ring-width",
      "--sk-shadow-brutal",
      "--sk-shadow-brutal-active",
      "--sk-shadow-brutal-none",
      "--sk-space-1",
      "--sk-space-3",
      "--sk-text-base-line-height",
      "--sk-text-base-size",
      "--sk-text-lg-size",
      "--sk-text-sm-line-height",
      "--sk-text-sm-size",
      "--sk-touch-min",
    ],
    ai: {
      summary:
        "A boolean toggle that participates in a plain HTML form. Validation is the browser's, not this component's.",
      whenToUse: [
        "The value is a single yes/no choice that submits with a form",
        "It must work without JavaScript: plain HTML form submission",
        "The browser's native constraint validation is wanted — required means required",
      ],
      whenNotToUse: [
        "The choice is one of several exclusive options — use a Radio Group",
        "It represents an on/off state that acts immediately without form submission — use a Switch",
        "The value is text — use an Input or Textarea",
      ],
      accessibility:
        'Renders a real native `<input type="checkbox">`, so the browser supplies constraint validation, Space-to-toggle, and autofill rather than this component reimplementing them. The label wraps the input, making the whole row the activation target with no click handler. `label`, `description`, and `error` are wired through the wrapping label and `aria-describedby`; an error sets `aria-invalid` and renders an icon beside its text, never color alone (WCAG 1.4.1). `indeterminate` is visual only (`aria-checked="mixed"`), and submits as unchecked. Implements the FACE contract: formResetCallback, formDisabledCallback, formStateRestoreCallback, and sk-value-change fires only for user-initiated changes.',
      example: '<sk-checkbox name="agree" label="I agree to the terms" required></sk-checkbox>',
      knownLimitations: [
        "The generated `id` for the inner control differs from React's `useId()`, so an SSR consumer must pass an explicit `id` for a separately-rendered `Label` to find it (section 4, forms contract)",
        "`indeterminate` is a property, not an attribute — it cannot be set in declarative HTML and resets on re-render if not re-applied",
      ],
    },
  },
  {
    name: "switch",
    tag: "sk-switch",
    stability: "stable",
    cssVariables: [
      "--sk-border-thick",
      "--sk-color-border-strong",
      "--sk-color-danger",
      "--sk-color-focus-ring",
      "--sk-color-primary",
      "--sk-color-primary-fg",
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
      "--sk-ring-offset",
      "--sk-ring-width",
      "--sk-shadow-brutal",
      "--sk-shadow-brutal-active",
      "--sk-shadow-brutal-none",
      "--sk-space-1",
      "--sk-space-3",
      "--sk-text-base-line-height",
      "--sk-text-base-size",
      "--sk-text-lg-size",
      "--sk-text-sm-line-height",
      "--sk-text-sm-size",
      "--sk-touch-min",
    ],
    ai: {
      summary:
        "An on/off control that acts immediately, rendered as a native checkbox carrying role=switch so the browser keeps validation and form submission.",
      whenToUse: [
        "The setting applies the moment it is toggled — a preference, a visibility toggle",
        "The state is genuinely binary: on or off, with no third state",
        "It must submit through a plain `<form>` with no JavaScript state",
      ],
      whenNotToUse: [
        "The choice is collected for a later submit — use a Checkbox",
        "The choice is one of several exclusive options — use a Radio Group",
        "The action triggers something rather than setting a state — use a Button",
      ],
      accessibility:
        'Renders a real native `<input type="checkbox">` carrying `role="switch"`, so the browser supplies constraint validation, Space-to-toggle, and autofill while assistive technology reads the state as on/off. The label wraps the input, making the whole row the activation target with no click handler. `label`, `description`, and `error` are wired through the wrapping label and `aria-describedby`; an error sets `aria-invalid` and renders an icon beside its text, never color alone (WCAG 1.4.1). Implements the FACE contract: formResetCallback, formDisabledCallback, formStateRestoreCallback, and sk-value-change fires only for user-initiated changes.',
      example: '<sk-switch name="dark" label="Dark mode"></sk-switch>',
      knownLimitations: [
        "The generated `id` for the inner control differs from React's `useId()`, so an SSR consumer must pass an explicit `id` for a separately-rendered `Label` to find it (section 4, forms contract)",
      ],
    },
  },
  {
    name: "radio-group",
    tag: "sk-radio-group",
    stability: "stable",
    cssVariables: [
      "--sk-border-thick",
      "--sk-color-border-strong",
      "--sk-color-danger",
      "--sk-color-focus-ring",
      "--sk-color-primary",
      "--sk-color-primary-fg",
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
      "--sk-ring-offset",
      "--sk-ring-width",
      "--sk-shadow-brutal",
      "--sk-shadow-brutal-active",
      "--sk-shadow-brutal-none",
      "--sk-space-1",
      "--sk-space-3",
      "--sk-text-base-line-height",
      "--sk-text-base-size",
      "--sk-text-base-weight",
      "--sk-text-lg-size",
      "--sk-text-sm-line-height",
      "--sk-text-sm-size",
      "--sk-touch-min",
    ],
    ai: {
      summary:
        "An exclusive choice from a small set of options, rendered as real native radios so the browser owns arrow-key navigation and validation.",
      whenToUse: [
        "Exactly one choice from 2–7 known options",
        "The options are short enough to read at a glance — longer lists want a Select",
        "It must submit through a plain `<form>` with no JavaScript state",
      ],
      whenNotToUse: [
        "More than roughly 7 options — use a Select, which scrolls and filters",
        "Several choices at once — use a Checkbox per option",
        "A single on/off setting that acts immediately — use a Switch",
      ],
      accessibility:
        'Renders real native `<input type="radio">` elements in a `role="radiogroup"` container, so the browser owns arrow-key navigation within the group, the single tab stop, and constraint validation ("please select one of these options" is the browser\'s message, not a reimplementation). The group label names the container through `aria-labelledby`; each option is labelled by its wrapping label. An error sets `aria-invalid` and renders an icon beside its text, never color alone (WCAG 1.4.1). Implements the FACE contract on the group: formResetCallback, formDisabledCallback, formStateRestoreCallback, and sk-value-change fires only for user-initiated changes.',
      example:
        '<sk-radio-group name="env" label="Environment" required options=\'[{"value":"production","label":"Production"},{"value":"staging","label":"Staging"}]\'></sk-radio-group>',
      knownLimitations: [
        "Options arrive as JSON, like Select — they cannot be slotted as children, because scoped encapsulation cannot distribute host children into the render tree",
        "The generated `id` for the group label differs from React's `useId()`, so an SSR consumer must pass an explicit `id` (section 4, forms contract)",
      ],
    },
  },
  {
    name: "card",
    tag: "sk-card",
    stability: "stable",
    cssVariables: [
      "--sk-border-thick",
      "--sk-border-width",
      "--sk-color-border",
      "--sk-color-border-strong",
      "--sk-color-shadow",
      "--sk-color-surface-raised",
      "--sk-color-text",
      "--sk-color-text-muted",
      "--sk-font-sans",
      "--sk-shadow-brutal",
      "--sk-shadow-brutal-none",
      "--sk-space-1",
      "--sk-space-2",
      "--sk-space-3",
      "--sk-space-4",
      "--sk-space-5",
      "--sk-space-6",
      "--sk-text-sm-line-height",
      "--sk-text-sm-size",
      "--sk-text-xl-line-height",
      "--sk-text-xl-size",
      "--sk-text-xl-weight",
    ],
    ai: {
      summary:
        "A hard-edged surface that groups related content, with optional header, body, and footer.",
      whenToUse: [
        "A group of related facts, settings, or actions needs a boundary of its own",
        "Content sits inside another surface and needs a raised panel to read against it",
        "A record needs a title, a body, and a row of actions below a rule",
      ],
      whenNotToUse: [
        "The whole card is one action — use a Button or a Link with card styling",
        "You are nesting it inside another card to group further — two competing fills and shadows read as noise",
        "The separation is a list of peers — use a plain list or a Separator",
      ],
      accessibility:
        'A card is a surface, not a control: it exposes no role, is not focusable, and has no interaction props, because a clickable card is a link or a button wearing a card\'s styling and adding a click handler here would produce something neither keyboard-reachable nor announced. `heading` renders as a `<span>`, not a heading, because the card does not know its level in the document outline — pass a real `<h2 slot="header">` when you need one. Slots are optional and each renders nothing when empty, so a card without a header carries no empty bordered band.',
      example:
        '<sk-card heading="Deployment" subtitle="Build 4821"><p>Shipped to production.</p></sk-card>',
      knownLimitations: [
        "There is no `size` prop: a card has no intrinsic height to scale, so `padding` is the axis it varies on",
        "There is no click handler, by design — a card that navigates should be a Link, and one that acts should be a Button",
      ],
    },
  },
  {
    name: "text",
    tag: "sk-text",
    stability: "stable",
    cssVariables: [
      "--sk-color-text-muted",
      "--sk-font-display",
      "--sk-font-mono",
      "--sk-font-sans",
      "--sk-text-2xl-line-height",
      "--sk-text-2xl-size",
      "--sk-text-2xl-tracking",
      "--sk-text-2xl-weight",
      "--sk-text-3xl-line-height",
      "--sk-text-3xl-size",
      "--sk-text-3xl-tracking",
      "--sk-text-3xl-weight",
      "--sk-text-4xl-line-height",
      "--sk-text-4xl-size",
      "--sk-text-4xl-tracking",
      "--sk-text-4xl-weight",
      "--sk-text-base-line-height",
      "--sk-text-base-size",
      "--sk-text-base-tracking",
      "--sk-text-base-weight",
      "--sk-text-display-line-height",
      "--sk-text-display-size",
      "--sk-text-display-sm-line-height",
      "--sk-text-display-sm-size",
      "--sk-text-display-sm-tracking",
      "--sk-text-display-sm-weight",
      "--sk-text-display-tracking",
      "--sk-text-display-weight",
      "--sk-text-lg-line-height",
      "--sk-text-lg-size",
      "--sk-text-lg-tracking",
      "--sk-text-lg-weight",
      "--sk-text-sm-line-height",
      "--sk-text-sm-size",
      "--sk-text-sm-tracking",
      "--sk-text-sm-weight",
      "--sk-text-xl-line-height",
      "--sk-text-xl-size",
      "--sk-text-xl-tracking",
      "--sk-text-xl-weight",
      "--sk-text-xs-line-height",
      "--sk-text-xs-size",
      "--sk-text-xs-tracking",
      "--sk-text-xs-weight",
    ],
    ai: {
      summary:
        "Applies one whole type step — size, line-height, weight, and tracking together — to any element.",
      whenToUse: [
        "A heading, paragraph, or label must match the type scale without hand-assembling four tokens",
        "The consumer's markup chooses the element; the look must come from the system",
        "Display-face headings at weight 800, or muted secondary text",
      ],
      whenNotToUse: [
        "Text inside a Button or Card heading slot — those components already apply their own steps",
        "You want to choose the element with a prop — pick the element in markup instead; an `as` prop is how heading levels end up contradicting the outline",
        "Text that is a control — a link is a Link, not styled text",
      ],
      accessibility:
        'Renders no wrapper and no role: the element the consumer chose keeps its semantics, and the component only sets typography. There is no `as` prop by design — an element-choosing prop invites `<h3 as="h2">`-style fixes that contradict the document outline. `muted` sets color only; the muted pair passes the contrast gates in both themes (6.64:1 light).',
      example: '<sk-text variant="2xl" family="display"><h1>Title</h1></sk-text>',
      knownLimitations: [
        "There is no `size` prop: `size` is the height scale other components use, and text has no intrinsic height — `variant` names the type step instead",
        "It does not truncate, clamp, or balance lines — layout concerns stay with the consumer",
      ],
    },
  },
  {
    name: "banner",
    tag: "sk-banner",
    stability: "stable",
    cssVariables: [
      "--sk-border-thick",
      "--sk-color-border-strong",
      "--sk-color-danger",
      "--sk-color-danger-fg",
      "--sk-color-danger-subtle",
      "--sk-color-primary",
      "--sk-color-primary-subtle",
      "--sk-color-primary-text",
      "--sk-color-shadow",
      "--sk-color-success",
      "--sk-color-success-fg",
      "--sk-color-success-subtle",
      "--sk-color-surface-sunken",
      "--sk-color-text",
      "--sk-color-text-muted",
      "--sk-color-warning",
      "--sk-color-warning-fg",
      "--sk-color-warning-subtle",
      "--sk-font-sans",
      "--sk-radius-full",
      "--sk-shadow-brutal",
      "--sk-space-1",
      "--sk-space-2",
      "--sk-space-3",
      "--sk-space-4",
      "--sk-text-base-line-height",
      "--sk-text-base-size",
      "--sk-text-base-weight",
      "--sk-text-sm-line-height",
      "--sk-text-sm-size",
      "--sk-text-sm-tracking",
      "--sk-text-sm-weight",
    ],
    ai: {
      summary: "A page-level message that spans its container above the content it is about.",
      whenToUse: [
        "A site-wide notice — maintenance, degraded service, an expiring trial",
        "A message that belongs to the whole page rather than to one section",
        "A persistent status the reader can act on from an actions slot",
      ],
      whenNotToUse: [
        "It belongs to one section and sits in the flow — use an Alert",
        "It must interrupt after a user action — use an Alert or a Toast",
        "It floats above the page and dismisses — use a Toast",
      ],
      accessibility:
        'Sets `role="region"`, not `role="banner"` — in ARIA `banner` is the site header and is one-per-page, so using it here would collide with the consumer\'s real `<header>`. A `region` is only exposed as a landmark when it has an accessible name, so `aria-label` or `aria-labelledby` is required for the banner to be reachable by landmark navigation; the React type enforces one of the two. An unnamed banner is left unnamed rather than given a made-up label. It is not a live region: a banner was already present when the page loaded, and announcing it as an interruption would talk over the content the reader came for. The glyph is decorative and hidden.',
      example:
        '<sk-banner variant="warning" heading="Scheduled maintenance" aria-label="Service status">Read-only on Saturday.</sk-banner>',
      knownLimitations: [
        "No dismiss button, by design: dismissing needs a close affordance, focus into it, and a focus return — a different component",
        "`fullWidth` is geometry, not material: it drops the offset shadow and side borders because a shadow makes a box read as floating above the page",
        "`heading` is a string, not a heading element — the component does not know its level in the document outline",
      ],
    },
  },
  {
    name: "avatar-group",
    tag: "sk-avatar-group",
    stability: "stable",
    cssVariables: [
      "--sk-border-thick",
      "--sk-color-border-strong",
      "--sk-color-surface-sunken",
      "--sk-color-text-muted",
      "--sk-font-sans",
      "--sk-height-lg",
      "--sk-height-md",
      "--sk-height-sm",
      "--sk-radius-full",
      "--sk-space-2",
      "--sk-text-xs-line-height",
      "--sk-text-xs-size",
      "--sk-text-xs-tracking",
      "--sk-text-xs-weight",
    ],
    ai: {
      summary: "A stacked row of avatars, with the ones past `max` collapsed into a named count.",
      whenToUse: [
        "A task, review, or thread shows several people in one row",
        "The list is longer than the space, so the tail becomes a count",
        "The group needs one accessible name, such as 'Assigned to'",
      ],
      whenNotToUse: [
        "There is one person — use an Avatar on its own",
        "Each person is separately actionable — use Buttons or Links; a group is not a menu",
        "You need each name announced individually — a group announces one sentence, not five stops",
      ],
      accessibility:
        '`role="group"` with the consumer\'s `label`, not a `list`: these are people, and a list would announce "list, 5 items" and walk the reader through each one when one sentence is more useful. The overflow is a `<span>` with `aria-label="N more"`, not a fourth avatar — \'+3\' is not a person and a circle would have no name. Avatars past `max` get `display: none`, which removes them from the accessibility tree, so the group announces exactly what it shows instead of reading five names over three visible ones. Without a `label` the group carries no role at all, because an unnamed `group` is skipped by most screen readers.',
      example:
        '<sk-avatar-group max="3" label="Assigned to"><sk-avatar name="Ada Lovelace"></sk-avatar></sk-avatar-group>',
      knownLimitations: [
        "The avatars are slotted `sk-avatar` elements, not a data array — a `people` prop would put name and initials logic in two places",
        "Overlap is a negative `margin-inline-start`, so it mirrors in RTL; nothing is absolutely positioned",
        "The count is recomputed at render time, not observed — adding avatars later requires a re-render",
      ],
    },
  },
  {
    name: "avatar",
    tag: "sk-avatar",
    stability: "stable",
    cssVariables: [
      "--sk-border-thick",
      "--sk-color-border-strong",
      "--sk-color-shadow",
      "--sk-color-surface-sunken",
      "--sk-color-text",
      "--sk-duration-control",
      "--sk-ease-arcade",
      "--sk-font-sans",
      "--sk-height-lg",
      "--sk-height-md",
      "--sk-height-sm",
      "--sk-radius-full",
      "--sk-shadow-sm",
      "--sk-text-base-size",
      "--sk-text-sm-size",
      "--sk-text-sm-weight",
      "--sk-text-xs-size",
      "--sk-text-xs-tracking",
    ],
    ai: {
      summary:
        "A circular portrait of a person, with initials derived from their name as the fallback.",
      whenToUse: [
        "A list or header identifies a person by their picture",
        "An account menu, comment, or assignment shows who it belongs to",
        "Several people are stacked in a group — see the Avatar Group entry",
      ],
      whenNotToUse: [
        "It is a company or project logo — that is an image, not a person",
        "It is clickable — wrap it in a Button or Link; an avatar takes no interaction",
        'The name is unknown and the picture is decorative — use a plain image with `alt=""`',
      ],
      accessibility:
        'The host carries `role="img"` and the person\'s name as its accessible name, so the picture is announced as the person rather than as a filename or as nothing. The `<img>` inside is `alt=""` and the initials are `aria-hidden`, because one announcement of a person is better than two competing ones. An avatar with neither a name nor initials is `aria-hidden` instead of an empty `role="img"` — an unnamed image is an axe violation, and defaulting the label to a word like "avatar" would announce the designer\'s word instead of the person\'s name. `data-state` distinguishes `absent` from `error`, which render identical pixels and are two different bugs.',
      example: '<sk-avatar name="Ada Lovelace" size="md"></sk-avatar>',
      knownLimitations: [
        "Initials take the first and last word only — name order, particles, and single-name cultures are locale questions, and §6 says locale is consumer-supplied",
        "There is no `initials` prop: they are derived from `name`, so the two cannot disagree",
        "`size` sets the diameter; the frame is square by ratio, so there is no separate width and height",
      ],
    },
  },
  {
    name: "field",
    tag: "sk-field",
    stability: "stable",
    cssVariables: [
      "--sk-color-danger-fg",
      "--sk-color-text",
      "--sk-color-text-muted",
      "--sk-font-sans",
      "--sk-space-1",
      "--sk-text-sm-line-height",
      "--sk-text-sm-size",
      "--sk-text-sm-tracking",
      "--sk-text-sm-weight",
      "--sk-text-xs-line-height",
      "--sk-text-xs-size",
      "--sk-text-xs-weight",
    ],
    ai: {
      summary: "Labels, describes, and marks a form control the consumer already owns.",
      whenToUse: [
        "The control is a plain `<input>`, a third-party widget, or not one of ours",
        "Several controls share one label and one error",
        "You need label, description, and error wiring without a form-associated wrapper",
      ],
      whenNotToUse: [
        "The control is `sk-input`, `sk-textarea`, or `sk-select` — those render their own label, description, and error",
        "You want a form-associated control — use Input; a Field is not form-associated and never submits",
        "You need a layout wrapper with no labelling — use a plain container",
      ],
      accessibility:
        "Puts `aria-labelledby`, `aria-describedby`, `aria-invalid`, and `aria-required` on the **control**, because that is the element a screen reader is on when it announces them, and sets nothing else — `value`, `name`, `disabled`, and validity stay the control's own. The description and error ids are appended together, not one replacing the other: an error that silences the hint removes the format instruction exactly when the user needs it. `invalid` and `error` are separate, so a field can be invalid before the consumer knows why. `required` renders an asterisk that is `aria-hidden` and a visually hidden word, so a reader hears 'required' rather than a symbol. The error carries a glyph as well as colour (WCAG 1.4.1).",
      example:
        '<sk-field label="Workspace name" description="Lowercase letters and dashes."><input type="text" /></sk-field>',
      knownLimitations: [
        "The field is not form-associated: it never sets `name`, never calls `setFormValue`, and does not participate in submission",
        "It adopts the first form control in its slot; a field wrapping several controls labels only the first",
        "It draws no chrome of its own — a box around a control that already has one reads as two nested inputs",
      ],
    },
  },
  {
    name: "kbd",
    tag: "sk-kbd",
    stability: "stable",
    cssVariables: [
      "--sk-border-thick",
      "--sk-color-border-strong",
      "--sk-color-shadow",
      "--sk-color-surface-sunken",
      "--sk-color-text",
      "--sk-font-mono",
      "--sk-radius-sm",
      "--sk-shadow-sm",
      "--sk-space-1",
      "--sk-space-2",
      "--sk-space-3",
      "--sk-text-sm-line-height",
      "--sk-text-sm-size",
      "--sk-text-sm-tracking",
      "--sk-text-xs-line-height",
      "--sk-text-xs-size",
      "--sk-text-xs-tracking",
      "--sk-text-xs-weight",
    ],
    ai: {
      summary:
        "Marks up a keyboard shortcut as a real `<kbd>` element, styled as hard-edged chrome.",
      whenToUse: [
        "Documentation or a menu item names a key the reader should press",
        "A shortcut appears inline with copy describing what it does",
        "Several keys form one combination, such as Ctrl, Shift, and K",
      ],
      whenNotToUse: [
        "The keys are not actually pressable here — use Text; `<kbd>` promises input the reader can make",
        "It is a button the user clicks with a keyboard shortcut beside it — the shortcut is a Kbd, the control is a Button",
        "It is a code sample or a terminal command — that is a Code block, not input",
      ],
      accessibility:
        "Renders a real `<kbd>` in the light DOM rather than a styled `<span>`, so assistive technology can identify the text as key input instead of reading a bare word — the difference between 'Shift' the key and 'shift' the sentence. It takes no role and no tab stop: a shortcut is text, not a control. The monospace family is functional, not decorative — 'l', '1', and 'I' are the same glyph in most UI faces and a shortcut is copied by eye.",
      example: "<sk-kbd>Ctrl</sk-kbd> <sk-kbd>Shift</sk-kbd> <sk-kbd>K</sk-kbd>",
      knownLimitations: [
        "There is no `variant` prop: this component has one look, and §4's two-prop rule applies to components with an axis to vary on",
        "It renders the key combination as plain text; separating multiple keys with '+' is the consumer's choice, and the component adds no separator",
      ],
    },
  },
  {
    name: "spinner",
    tag: "sk-spinner",
    stability: "stable",
    cssVariables: [
      "--sk-color-text",
      "--sk-duration-control-slow",
      "--sk-icon-lg",
      "--sk-icon-md",
      "--sk-icon-sm",
      "--sk-radius-full",
    ],
    ai: {
      summary:
        "A spinning ring for an operation in progress, announced to screen readers by its label rather than by the moving picture.",
      whenToUse: [
        "An operation is running and the interface cannot say how far along it is",
        "A button or icon button is in its loading state and needs an inline indicator",
      ],
      whenNotToUse: [
        "Progress is measurable — use a Progress bar; a spinner cannot say 60%",
        "Content is loading into a known layout — use a Skeleton, which promises the layout instead of motion",
      ],
      accessibility:
        'Carries `role="status"` so screen readers announce it as a live region. The visible ring is `aria-hidden` — it is a picture of waiting, and `label` (default "Loading") is what gets announced; `status` replaces it when progress is known. Under `prefers-reduced-motion` the spin stops rather than slows: a slow spinner still implies movement it cannot show, so the ring freezes solid and the label carries the whole story. Same ruling as Icon Button\'s loading state — if one changes, both must.',
      example: '<sk-spinner label="Saving draft"></sk-spinner>',
      knownLimitations: [
        "It cannot express progress fraction — that is a Progress bar's job, not a faster spin",
      ],
    },
  },
  {
    name: "skeleton",
    tag: "sk-skeleton",
    stability: "stable",
    cssVariables: [
      "--sk-color-surface",
      "--sk-color-surface-sunken",
      "--sk-duration-overlay-slow",
      "--sk-height-md",
      "--sk-icon-lg",
      "--sk-radius-full",
      "--sk-text-base-line-height",
    ],
    ai: {
      summary:
        "A grey placeholder in the shape of content that is loading, so the page does not shift when the content arrives.",
      whenToUse: [
        "Content is loading into a known layout and the space must be held",
        "A list, table, or card grid is fetching and the shape of what arrives is already known",
      ],
      whenNotToUse: [
        "An operation's duration matters — use a Spinner or Progress",
        "The placeholder would be on screen more than a moment or two — show a real empty state instead",
      ],
      accessibility:
        "`aria-hidden` by design: a skeleton is scaffolding, not content, and announcing five grey rectangles before a table loads is noise. There is no `label` prop on purpose — if a region needs announcing while it loads, that is a live region and the consumer owns it. Real content announces itself when it arrives. Dimensions are the feature: every variant sets a default size the consumer overrides, because a skeleton that guesses the content's height causes the very layout shift it exists to prevent. Under reduced motion the shimmer is removed entirely rather than slowed — a slower shimmer is still motion, and the grey shape is the whole message.",
      example: '<sk-skeleton variant="text" style="inline-size: 60%"></sk-skeleton>',
      knownLimitations: [
        "No slot by design: real content replaces the element, not its children",
        "`direction` is a prop, not auto-detected — the component does not know its locale",
      ],
    },
  },
  {
    name: "label",
    tag: "sk-label",
    stability: "stable",
    cssVariables: [
      "--sk-color-danger",
      "--sk-color-text",
      "--sk-space-1",
      "--sk-text-sm-line-height",
      "--sk-text-sm-size",
      "--sk-text-sm-weight",
    ],
    ai: {
      summary:
        "A programmatic label for any control: names it through `for`, and clicking it focuses the control through the browser's own activation.",
      whenToUse: [
        "A control was built without its own label and needs one that is actually associated",
        "A checkbox or switch needs its marker before the text, where the control leads the sentence",
        "A custom field needs the same label record Input's built-in label uses",
      ],
      whenNotToUse: [
        "The control already has a label prop — Input and Textarea wire their own; two labels for one control is a bug",
        "It would label nothing — `for` is required; a label with no control is a span with ambition, use plain text",
        "The text describes a group of controls — use a Fieldset or a heading, not a label",
      ],
      accessibility:
        "Associates through `htmlFor` pointing at the control's id, so clicking the label focuses the control via the browser's own activation — no click handler here, because the platform's is better and reimplementing it means reimplementing its edge cases. The required marker is `aria-hidden`: the control's own `required` attribute carries the semantics, the asterisk is for the sighted, and color alone never carries it (WCAG 1.4.1). `required` here does not set anything on the control — a label reaching into another component's DOM is exactly what section 4 forbids.",
      example:
        '<sk-label for="newsletter-email">Email address</sk-label>\n<input id="newsletter-email" type="email">',
      knownLimitations: [
        "Field components render their control with the id `${hostId}-control`, so `for` must carry that suffix — a cross-component id contract is tracked as open",
        "It cannot label a control rendered inside a shadow root it cannot see — `for` must match a light-DOM id",
        "It does not generate ids; pair it with the control's own id or React's `useId()`",
      ],
    },
  },
  {
    name: "separator",
    tag: "sk-separator",
    stability: "stable",
    cssVariables: ["--sk-border-width", "--sk-color-border"],
    ai: {
      summary:
        "A hairline between content: a real <hr> that announces itself unless it is purely visual.",
      whenToUse: [
        "Two groups of content need a thematic break between them",
        "A form's sections need dividing without a heading",
        "A vertical rule splits two columns",
      ],
      whenNotToUse: [
        "The break is already communicated by a heading or Card boundary — mark it `decorative` or skip it",
        "You are separating items in a list — use spacing or a list style; it is the honest tool",
        'Two routes branch at a choice — use Tabs or a Radio Group to express the choice; "or" between buttons is not a widget',
      ],
      accessibility:
        'Renders a real `<hr>`, announced as a separator by screen readers. `decorative` flips it to `role="none"` for lines that exist only for the eye. A `label` (e.g. "or" between two actions) is announced only when the separator is meaningful — a name on a `role="none"` element is a contradiction. The line is the 1px hairline token, not the 3px chrome stroke: a separator divides content, and a 3px stroke between paragraphs reads as a wall.',
      example: '<sk-separator label="or"></sk-separator>',
      knownLimitations: [
        "Vertical separators need a sized parent — `align-self: stretch` is the default, not a guarantee",
        "No motion, no chrome, by design — the one component where the hairline is the point",
      ],
    },
  },
  {
    name: "select",
    tag: "sk-select",
    stability: "stable",
    cssVariables: [
      "--sk-border-thick",
      "--sk-color-border-strong",
      "--sk-color-danger",
      "--sk-color-focus-ring",
      "--sk-color-shadow",
      "--sk-color-surface",
      "--sk-color-surface-sunken",
      "--sk-color-text",
      "--sk-duration-control",
      "--sk-duration-control-fast",
      "--sk-ease-arcade",
      "--sk-ease-arcade-exit",
      "--sk-font-sans",
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
        "A real native <select>, visibly: submits through a plain form, validates natively, and the popup is the browser's own.",
      whenToUse: [
        "The value is one of a fixed set of choices",
        "The form must submit through plain HTML with no component state reading",
        "The list is long enough that radio buttons would be a wall",
      ],
      whenNotToUse: [
        "The choice is between two options — use a Switch or two Radio Buttons; a select hides the answer",
        "The options depend on typing — use a Combobox",
        "There are fewer than five options and the page has room — Radio Group shows every answer at once",
      ],
      accessibility:
        "Renders a real native `<select>`, visibly — §4's hidden-native path was rejected deliberately, so the popup is the browser's: touch, wheel, typeahead, and native validation all work without a listbox reimplementing them. FACE with all three form callbacks; `required` is enforced by the browser and never suppressed; the label is associated through `for`, and an error sets `aria-invalid` with an icon beside its text, never color alone (WCAG 1.4.1). `sk-value-change` fires only for user-initiated changes. Options are JSON, because slot distribution cannot move host children into the render tree.",
      example:
        '<sk-select name="environment" label="Environment" required placeholder="Choose an environment" options=\'[{"value":"production","label":"Production"}]\'></sk-select>',
      knownLimitations: [
        "The popup cannot be styled — that is the trade the visible-native decision makes, and it is why the popup works everywhere",
        "Options are JSON, not slotted markup — slot distribution cannot reach the render tree",
        "SSR consumers must pass an explicit `id` for a separately-rendered `Label` to find it (section 4, forms contract)",
      ],
    },
  },
  {
    name: "tabs",
    tag: "sk-tabs",
    elements: [
      { tag: "sk-tab", dir: "sk-tabs" },
      { tag: "sk-tab-panel", dir: "sk-tabs" },
    ],
    stability: "stable",
    cssVariables: [
      "--sk-border-thick",
      "--sk-color-border",
      "--sk-color-border-strong",
      "--sk-color-focus-ring",
      "--sk-color-surface",
      "--sk-color-text",
      "--sk-color-text-muted",
      "--sk-font-sans",
      "--sk-ring-offset",
      "--sk-ring-width",
      "--sk-space-2",
      "--sk-space-4",
      "--sk-text-base-line-height",
      "--sk-text-base-size",
      "--sk-text-lg-weight",
      "--sk-text-sm-line-height",
      "--sk-text-sm-size",
      "--sk-text-sm-weight",
    ],
    ai: {
      summary:
        "Roving-tabindex tabs: the tablist owns the keyboard, arrows move and activate, and the active panel is the only one rendered.",
      whenToUse: [
        "Related content shares one surface and only one view matters at a time",
        "The views are peers — Settings-style sections, editor panes",
        "Switching should feel like moving, not navigating",
      ],
      whenNotToUse: [
        "Each view is a destination — use navigation, not tabs",
        "The views must be compared side by side — show them all",
        "Content must stay mounted across switches — this component unmounts inactive panels",
      ],
      accessibility:
        'The ARIA tabs pattern\'s hard rule is enforced: only the active tab is in the tab order, arrow keys move and activate (automatic activation), Home and End jump to the ends, and activation wraps. Tabs are real `<button>`s. `aria-selected` / `aria-controls` / `aria-labelledby` are computed and written by the widget, because tabs and panels are separately slotted. Arrow semantics derive from `getComputedStyle().direction` at interaction time, so `dir="rtl"` inverts Left and Right with no build flag (§4). The active panel carries `tabindex=0` so keyboard users reach its content after the last tab.',
      example:
        '<sk-tabs>\n  <div slot="tablist" data-slot="tablist">\n    <sk-tab label="Account"></sk-tab>\n    <sk-tab label="Billing"></sk-tab>\n  </div>\n  <sk-tab-panel><p>Account settings.</p></sk-tab-panel>\n  <sk-tab-panel><p>Billing history.</p></sk-tab-panel>\n</sk-tabs>',
      knownLimitations: [
        "Inactive panels are hidden, not kept alive — state inside a panel is lost on switch, unless the application holds it",
        'The tablist slot must carry `data-slot="tablist"` and each part its `data-slot` — the wiring contract is structural',
      ],
    },
  },
  {
    name: "tooltip",
    tag: "sk-tooltip",
    stability: "stable",
    cssVariables: [
      "--sk-color-text",
      "--sk-font-sans",
      "--sk-space-2",
      "--sk-space-3",
      "--sk-space-4",
      "--sk-text-sm-line-height",
      "--sk-text-sm-size",
      "--sk-z-tooltip",
    ],
    ai: {
      summary:
        "A short description of something the user can already see: shows on hover and keyboard focus, announced on demand via aria-describedby.",
      whenToUse: [
        "An icon-only control needs its name spelled out",
        "A jargon term or abbreviation needs one sentence of context",
        "A control is disabled and the reason helps",
      ],
      whenNotToUse: [
        "The information is essential — put it in the page; a tooltip hides it from touch and from anyone not hovering",
        "The content is interactive or long — use a Popover",
        "It is the control's name — use a Label or aria-label; a tooltip is a description, not the name",
      ],
      accessibility:
        "Named through `aria-describedby` pointing at the panel, so a screen reader reads it on demand — a tooltip that grabs focus is a popup wearing a tiny hat. Shows on hover after a delay (a tooltip that fires instantly is a strobe) and immediately on keyboard focus, because a tabbing user asked for it explicitly and a 300ms penance on every tab is hostile. Escape hides it. The panel takes no pointer events (`pointer-events: none`), so hovering the tooltip never flickers it away. Explicitly excluded from the forms contract (section 4): it cannot be form-associated.",
      example:
        '<sk-tooltip placement="top">\n  <sk-button slot="trigger">Deploy</sk-button>\n  Ships the current build to production.\n</sk-tooltip>',
      knownLimitations: [
        "Placement is a hint, not a viewport-aware computation — the panel anchors to the trigger and can clip at edges",
        "Touch has no hover: a tooltip is invisible on touch until the control is focused",
        "The trigger must be a focusable element — a non-interactive span gives keyboard users nothing to describe",
      ],
    },
  },
  {
    name: "toast",
    tag: "sk-toast",
    stability: "stable",
    cssVariables: [
      "--sk-color-border-strong",
      "--sk-color-danger",
      "--sk-color-success",
      "--sk-color-text",
      "--sk-color-warning",
      "--sk-font-sans",
      "--sk-space-3",
      "--sk-space-4",
      "--sk-text-lg-size",
      "--sk-z-toast",
    ],
    ai: {
      summary:
        "A non-blocking notification on the glass material: announced politely, auto-dismissed, never stealing focus.",
      whenToUse: [
        "A background operation finished and the user was looking somewhere else",
        "A state change should be acknowledged without interrupting work",
        "An error needs time and a close button, not a decision",
      ],
      whenNotToUse: [
        "The user must choose before the page continues — use an Alert Dialog",
        "The message needs the page's context hidden — use a Dialog",
        "The information is permanent UI, not an event — use a Card or a Badge",
      ],
      accessibility:
        '`role="status"`, a polite live region: announced when it appears, never stealing focus — the user was looking somewhere else, and a toast that shouts is a dialog wearing a smaller skirt. Hover or focus pauses the auto-dismiss clock, because a message that disappears mid-read is an announcement that never happened. `duration=0` never expires: an error the user must act on deserves more than an expired apology. The close button carries a real `aria-label` — a bare × is a picture to a screen reader. Severity is a 3px left edge plus the message text, never color alone (WCAG 1.4.1).',
      example: '<sk-toast variant="success" duration="5000">Build 4821 deployed.</sk-toast>',
      knownLimitations: [
        "It is a single toast — the consumer's region owns stacking and placement",
        "It never takes focus, so keyboard users meet it only through announcement; an actionable toast needs a persistent surface",
      ],
    },
  },
  {
    name: "alert-dialog",
    tag: "sk-alert-dialog",
    stability: "stable",
    cssVariables: ["--sk-border-thick", "--sk-color-danger", "--sk-space-2", "--sk-space-3"],
    ai: {
      summary:
        "A forced decision on the glass material: role=alertdialog, no Escape, no backdrop click — the user must choose an action.",
      whenToUse: [
        "The action is destructive and irreversible — a delete, a revoke, a permanent change",
        "The page cannot continue until the question is answered",
        "The interruption must be announced as an interruption, not as a window",
      ],
      whenNotToUse: [
        "The user may reasonably decline without answering — use a Dialog, which allows Escape and optional backdrop dismissal",
        "The message is informational and needs no decision — use a Toast or Alert",
        "The action has a URL or needs deep linking — use a page",
      ],
      accessibility:
        "`role=\"alertdialog\"`, so assistive technology announces an interruption rather than a window. Escape is *refused* and the backdrop does not dismiss: a dialog that lets Escape answer its question did not need to be asked — this is the ARIA APG's requirement for the role, not a style choice. Focus lands on `initialFocus` (the consumer's chosen default action) rather than the first focusable, because in a delete confirmation the wrong default is a destructive one. Label it with a real heading in the `title` slot. The panel wears the danger stroke: an interruption should look like one before a single word is read.",
      example:
        '<sk-alert-dialog initial-focus="#cancel">\n  <sk-text variant="lg" slot="title"><h3>Delete this repository?</h3></sk-text>\n  <p>This cannot be undone.</p>\n  <sk-button id="cancel" variant="secondary">Cancel</sk-button>\n</sk-alert-dialog>',
      knownLimitations: [
        "There is no trigger slot: the application raises it in response to something, never the user browsing",
        "There is no imperative `close()` without a decision — the only exit is an action",
      ],
    },
  },
  {
    name: "dialog",
    tag: "sk-dialog",
    stability: "stable",
    cssVariables: [
      "--sk-border-width",
      "--sk-color-border",
      "--sk-color-shadow",
      "--sk-color-text",
      "--sk-font-sans",
      "--sk-radius-glass",
      "--sk-shadow-lg",
      "--sk-space-2",
      "--sk-space-4",
      "--sk-space-6",
      "--sk-z-modal",
    ],
    ai: {
      summary:
        "A modal overlay on the glass material: focus is trapped by the native <dialog>, Escape closes, and focus returns to the invoker.",
      whenToUse: [
        "A decision must block the page until it is made — a confirmation, a discard warning",
        "A short form needs the page's context hidden, not merely behind",
        "Content must interrupt without navigating — use a page for anything that needs a URL",
      ],
      whenNotToUse: [
        "Content is supplementary and the page should stay live — use a Popover or Toast",
        "The flow has its own URL or needs deep linking — use a page",
        "It is a non-blocking status update — use a Toast",
      ],
      accessibility:
        "Renders the native `<dialog>` element: focus trapping, Escape, and inert background content are the browser's, not reimplemented. Focus returns to the invoker on close, so a keyboard user is not dropped at the top of the document. Label it with a real heading in the `title` slot — it is visible to everyone and doubles as the dialog's accessible name. One `sk-open-change` event reports every close path: trigger, Escape, backdrop, and a consumer setting the prop. The backdrop is translucent ink, not blur — the glass panel already blurs what is under it. `dismissible` is off by default: a dialog holding form input loses work to a stray click.",
      example:
        '<sk-dialog dismissible>\n  <sk-button slot="trigger">Open</sk-button>\n  <sk-text variant="lg" slot="title"><h3>Discard draft?</h3></sk-text>\n  <p>Your draft will be deleted.</p>\n</sk-dialog>',
      knownLimitations: [
        "The native `<dialog>` element is Baseline-tier: Core-tier browsers get the non-modal degradation, not the modal",
        "Slotted content is moved into the panel once at upgrade — content added to the host after upgrade is not distributed",
      ],
    },
  },
  {
    name: "alert",
    tag: "sk-alert",
    stability: "stable",
    cssVariables: [
      "--sk-border-thick",
      "--sk-color-border-strong",
      "--sk-color-danger",
      "--sk-color-danger-fg",
      "--sk-color-danger-subtle",
      "--sk-color-primary",
      "--sk-color-primary-subtle",
      "--sk-color-primary-text",
      "--sk-color-shadow",
      "--sk-color-success",
      "--sk-color-success-fg",
      "--sk-color-success-subtle",
      "--sk-color-surface-sunken",
      "--sk-color-text",
      "--sk-color-text-muted",
      "--sk-color-warning",
      "--sk-color-warning-fg",
      "--sk-color-warning-subtle",
      "--sk-font-sans",
      "--sk-shadow-brutal",
      "--sk-shadow-brutal-none",
      "--sk-space-1",
      "--sk-space-2",
      "--sk-space-3",
      "--sk-space-4",
      "--sk-text-base-line-height",
      "--sk-text-base-size",
      "--sk-text-base-weight",
      "--sk-text-sm-line-height",
      "--sk-text-sm-size",
      "--sk-text-sm-tracking",
      "--sk-text-sm-weight",
    ],
    ai: {
      summary:
        "An inline message about the current page: a success, a warning, a failure, or a note.",
      whenToUse: [
        "A result or a state needs stating next to the content it describes",
        "A page-level or form-level failure must be visible without a modal",
        "The message may need an action, such as Retry or View logs",
      ],
      whenNotToUse: [
        "It interrupts a flow the user must acknowledge — use an Alert Dialog",
        "It is a transient, self-dismissing update — use a Toast",
        "It labels a value with one word's worth of state — use a Badge",
      ],
      accessibility:
        'Carries `role="alert"` for the danger and warning variants, so those interrupt; the rest are `role="status"` and wait for a pause. The variant glyph is aria-hidden and differs in shape as well as colour, so the message survives a monochrome display. A consumer-set `role` is never overwritten.',
      example:
        '<sk-alert variant="warning" heading="Quota nearly full">Your workspace is using 96% of its quota.</sk-alert>',
      knownLimitations: [
        "No dismiss control, deliberately: a dismissible alert needs focus management and a close affordance that belongs to a Dialog or a Toast",
        "The actions slot is not part of the announced message, so an action the user must take also needs to exist in the page",
      ],
    },
  },
  {
    name: "progress",
    tag: "sk-progress",
    stability: "stable",
    cssVariables: [
      "--sk-border-thick",
      "--sk-border-width",
      "--sk-color-border-strong",
      "--sk-color-primary",
      "--sk-color-surface-sunken",
      "--sk-duration-overlay-slow",
      "--sk-ease-glass",
      "--sk-space-2",
      "--sk-space-4",
      "--sk-space-6",
    ],
    ai: {
      summary: "Shows how far along a task is, or that a task is running with no known end.",
      whenToUse: [
        "Work is in progress and the user is waiting on it",
        "The completion fraction is known and moving",
        "The progress explains why something else on the page is unavailable",
      ],
      whenNotToUse: [
        "The operation finished and its result is what matters — use an Alert",
        "A single unmeasured delay is all there is — use a Spinner",
        "It is a placeholder for content that is about to arrive — use a Skeleton",
      ],
      accessibility:
        '`role="progressbar"` with `aria-valuemin` and `aria-valuemax`, and `aria-valuenow` only when the value is determinate — an indeterminate bar that announced a number would be lying. The bar\'s width is derived from value over max. The `label` prop becomes `aria-label` only when the consumer set none of its own.',
      example: '<sk-progress label="Uploading build 4821" value="40"></sk-progress>',
      knownLimitations: [
        "No percentage text is rendered: formatting a number for the reader's locale is an Intl decision this element does not make",
        "Under reduced motion the indeterminate bar keeps a static partial fill rather than sitting at zero, because an empty track reads as not started rather than unknown",
      ],
    },
  },
  {
    name: "empty-state",
    tag: "sk-empty-state",
    stability: "stable",
    cssVariables: [
      "--sk-border-thick",
      "--sk-color-border",
      "--sk-color-border-strong",
      "--sk-color-shadow",
      "--sk-color-surface-raised",
      "--sk-color-text",
      "--sk-color-text-muted",
      "--sk-font-sans",
      "--sk-icon-lg",
      "--sk-icon-md",
      "--sk-shadow-brutal",
      "--sk-shadow-brutal-none",
      "--sk-space-2",
      "--sk-space-3",
      "--sk-space-4",
      "--sk-space-5",
      "--sk-space-6",
      "--sk-space-8",
      "--sk-text-lg-line-height",
      "--sk-text-lg-size",
      "--sk-text-lg-weight",
      "--sk-text-sm-line-height",
      "--sk-text-sm-size",
    ],
    ai: {
      summary: "The surface a list, table, or panel shows when it has nothing to display.",
      whenToUse: [
        "A region is legitimately empty and the page should say why",
        "The empty region has a next action, such as Create or Import",
        "A filter or a search matched nothing and the user can widen it",
      ],
      whenNotToUse: [
        "The content is still loading — use a Skeleton or a Spinner",
        "The message is about the page as a whole — use an Alert",
        "It is a placeholder for one field inside a form",
      ],
      accessibility:
        'Not focusable, with no role and no live region: an empty state is content, not a status change, and announcing "no results" on every render is noise. `heading` renders as a span rather than a heading element, because the level belongs to the consumer\'s document outline — put a real heading in the body slot when it needs to be one. Slotted actions keep their own semantics.',
      example:
        '<sk-empty-state heading="No deploys yet" description="Push to main and the first build starts on its own.">\n  <sk-button slot="actions">New deploy</sk-button>\n</sk-empty-state>',
      knownLimitations: [
        "`bare` drops the fill, the border, and the shadow rather than restyling them, because it exists for one inside a Card",
        "The icon slot falls back to a dashed CSS glyph: this package ships no icon set",
      ],
    },
  },
  {
    name: "accordion",
    tag: "sk-accordion",
    elements: [{ tag: "sk-accordion-item", dir: "sk-accordion" }],
    stability: "stable",
    cssVariables: [
      "--sk-border-thick",
      "--sk-border-width",
      "--sk-color-border",
      "--sk-color-border-strong",
      "--sk-color-focus-ring",
      "--sk-color-shadow",
      "--sk-color-surface-raised",
      "--sk-color-text",
      "--sk-duration-control",
      "--sk-duration-control-fast",
      "--sk-ease-arcade",
      "--sk-ease-arcade-exit",
      "--sk-font-sans",
      "--sk-ring-offset",
      "--sk-ring-width",
      "--sk-shadow-brutal",
      "--sk-shadow-brutal-none",
      "--sk-space-3",
      "--sk-space-4",
      "--sk-text-base-line-height",
      "--sk-text-base-size",
      "--sk-text-base-weight",
      "--sk-touch-min",
    ],
    ai: {
      summary: "A stack of disclosure panels where one, or several, can be open at a time.",
      whenToUse: [
        "Secondary content belongs on the page but should not occupy it — questions, advanced settings, release notes",
        "The reader opens panels in any order and may want none of them open",
        "The content is short enough to expand in place rather than to open a route",
      ],
      whenNotToUse: [
        "The sections are the page's navigation — use Tabs",
        "The content must be read in order, or hiding it loses the thread — keep it on the page",
        "Every panel starts open and none should close — use headings and sections",
      ],
      accessibility:
        "Built on the native `<details>` and `<summary>` elements, so the disclosure semantics, the focus stop, the expanded state, and Enter and Space are the browser's rather than reimplemented — which is why the item needs no ARIA of its own. The marker is aria-hidden and drawn with pseudo-elements. `heading` renders as a span inside the summary; a consumer that needs a real heading level puts one in the slot. The summary meets `--sk-touch-min`.",
      example:
        '<sk-accordion>\n  <sk-accordion-item heading="What is Santaka UI?" open>\n    <p>A token layer, a universal package, and framework adapters.</p>\n  </sk-accordion-item>\n  <sk-accordion-item heading="Does it need a framework?">\n    <p>No.</p>\n  </sk-accordion-item>\n</sk-accordion>',
      knownLimitations: [
        "Exclusive by default: opening an item closes its siblings, and `multiple` opts out",
        "No group-level event summarises the open items — each item dispatches its own bubbling `sk-open-change` with `detail.open`",
      ],
    },
  },
  {
    name: "slider",
    tag: "sk-slider",
    stability: "stable",
    cssVariables: [
      "--sk-border-thick",
      "--sk-color-border-strong",
      "--sk-color-danger-fg",
      "--sk-color-primary",
      "--sk-color-shadow",
      "--sk-color-surface",
      "--sk-color-surface-sunken",
      "--sk-color-text",
      "--sk-color-text-muted",
      "--sk-font-sans",
      "--sk-shadow-sm",
      "--sk-space-1",
      "--sk-space-2",
      "--sk-text-sm-line-height",
      "--sk-text-sm-size",
      "--sk-text-sm-tracking",
      "--sk-text-sm-weight",
      "--sk-text-xs-line-height",
      "--sk-text-xs-size",
      "--sk-text-xs-weight",
    ],
    ai: {
      summary: "Picks one number from a range, on a track the reader drags or arrows across.",
      whenToUse: [
        "The value is a number on a known range, such as volume or a budget ceiling",
        "The exact number matters less than where it sits in the range",
        "Steps are meaningful — volume in fives, budget in tens",
      ],
      whenNotToUse: [
        "The reader must type an exact figure — use an Input with type=number",
        "There are fewer than five discrete choices — use a Radio Group",
        "You need two ends of a range — use two sliders, or a dedicated range control",
      ],
      accessibility:
        'A real `<input type="range">`, so the platform owns the slider role, `aria-valuenow`, the arrow/Page/Home/End model, and the touch target — all of which a `<div role="slider">` reimplementation tends to lose. `aria-valuetext` takes a consumer-supplied `format` template ("$v of $m"), because §6 says locale is consumer-supplied. The label points at the control by id; the description and error ids are appended together rather than one replacing the other.',
      example:
        '<sk-slider name="volume" label="Volume" value="40" show-value format="$v of $m"></sk-slider>',
      knownLimitations: [
        "The thumb's square shape is asserted on Chromium and Firefox; WebKit exposes neither thumb pseudo-element to getComputedStyle",
        "SSR consumers must pass an explicit id — the counter differs between server and client",
        "The visual fill on Chromium comes from the platform's own rendering, not a custom element",
      ],
    },
  },
  {
    name: "breadcrumb",
    tag: "sk-breadcrumb",
    stability: "stable",
    cssVariables: [
      "--sk-color-border-strong",
      "--sk-color-primary",
      "--sk-color-primary-text",
      "--sk-color-text-muted",
      "--sk-font-sans",
      "--sk-space-2",
      "--sk-text-sm-line-height",
      "--sk-text-sm-size",
      "--sk-text-sm-weight",
    ],
    ai: {
      summary: "Shows where the current page sits in a hierarchy, oldest ancestor first.",
      whenToUse: [
        "The page is more than two levels deep",
        "The reader needs to move up one or more levels",
        "The hierarchy, not the history, is what matters — this is not a back button",
      ],
      whenNotToUse: [
        "The page is flat or one level deep — a breadcrumb with one item says nothing",
        "You want to go back to where the reader came from — use a Link or the browser's back",
        "The trail is a stepped process — use a Stepper",
      ],
      accessibility:
        '`<nav aria-label="Breadcrumb">` wrapping an `<ol>`, so it is a landmark a screen reader can jump to and announces as a hierarchy rather than as unrelated links. The last item carries `aria-current="page"` and is not a link — a link to the page you are on is a no-op that reads as actionable. Separators are drawn with `::before` and carry no text, so nothing announces between the items.',
      example:
        '<sk-breadcrumb items=\'[{"label":"Home","href":"/"},{"label":"Projects","href":"/projects"},{"label":"Santaka"}]\'></sk-breadcrumb>',
      knownLimitations: [
        "An empty trail renders nothing at all rather than an empty landmark",
        "`items` is JSON, not slotted children, because the component must know which entry is last",
      ],
    },
  },
  {
    name: "pagination",
    tag: "sk-pagination",
    stability: "stable",
    cssVariables: [
      "--sk-border-thick",
      "--sk-color-border",
      "--sk-color-border-strong",
      "--sk-color-primary",
      "--sk-color-primary-fg",
      "--sk-color-primary-text",
      "--sk-color-shadow",
      "--sk-color-surface",
      "--sk-color-surface-sunken",
      "--sk-color-text-muted",
      "--sk-font-sans",
      "--sk-shadow-brutal",
      "--sk-shadow-sm",
      "--sk-space-2",
      "--sk-text-sm-line-height",
      "--sk-text-sm-size",
      "--sk-text-sm-weight",
    ],
    ai: {
      summary: "Moves between pages of a list, with a window around the current page.",
      whenToUse: [
        "A list is split into numbered pages",
        "The reader needs to jump to a known page, not just the next one",
        "The total number of pages is known",
      ],
      whenNotToUse: [
        "Items load as you scroll — use infinite scrolling instead",
        "There are only two or three pages — Prev/Next alone is less to read",
        "The pages are steps in a process — use a Stepper",
      ],
      accessibility:
        '`<nav>` with an accessible name, and page numbers are links because a page is a destination — a `<button>` would misdescribe navigation as an action. The current page carries `aria-current="page"` and is not a link. The ellipsis is empty and `aria-hidden`, so it is not announced as a stop and cannot take focus. Prev and Next carry visually hidden words, because "‹" alone announces as punctuation.',
      example: "<sk-pagination count={12} page={6}></sk-pagination>",
      knownLimitations: [
        "The window is computed here; `siblings` controls how many pages sit either side",
        "Without an `href` template the component handles the navigation and emits `sk-page-change`; with one, the links are real and the browser navigates",
      ],
    },
  },
  {
    name: "drawer",
    tag: "sk-drawer",
    stability: "stable",
    cssVariables: [
      "--sk-border-thick",
      "--sk-color-border-strong",
      "--sk-color-shadow",
      "--sk-color-text",
      "--sk-duration-overlay",
      "--sk-ease-glass",
      "--sk-font-sans",
      "--sk-space-6",
      "--sk-text-sm-line-height",
      "--sk-text-sm-size",
      "--sk-z-modal",
    ],
    ai: {
      summary: "A panel that slides in from one edge, for navigation or a persistent side task.",
      whenToUse: [
        "Navigation or filters live beside the content rather than over it",
        "The panel stays open while the reader works — a non-modal side panel",
        "The content is taller than it is wide, such as a menu or a filter list",
      ],
      whenNotToUse: [
        "It must interrupt and demand a decision — use a Dialog or Alert Dialog",
        "The content is a short description of a control — use a Tooltip",
        "The content is a small menu anchored to a button — use a Popover",
      ],
      accessibility:
        'Reuses the dialog mechanics in `shared/dialog-base.ts`, so the native `<dialog>` owns focus trapping, Escape, `::backdrop`, and inert background content — nothing is reimplemented. Focus returns to the trigger on close. `side` is logical: `start` and `end` mirror under `dir="rtl"` (ADR-016), and there is deliberately no physical `left`/`right` pair, because a fixed edge is exactly what puts a drawer on the wrong side of a right-to-left document.',
      example:
        '<sk-drawer side="end" label="Settings"><sk-button slot="trigger">Open</sk-button><h3 slot="title">Settings</h3></sk-drawer>',
      knownLimitations: [
        "The panel needs an `[hidden][open]` rule: scoped mode writes `hidden` onto elements hosting a `<slot>`, which otherwise leaves an open drawer invisible",
        "No physical side values — see the accessibility note",
      ],
    },
  },
  {
    name: "taka",
    tag: "sk-taka",
    stability: "stable",
    cssVariables: [
      "--sk-color-primary",
      "--sk-color-primary-subtle",
      "--sk-color-border-strong",
      "--sk-color-surface",
      "--sk-color-warning",
      "--sk-duration-control-slow",
      "--sk-duration-overlay",
      "--sk-ease-arcade",
    ],
    ai: {
      summary: "The project mascot, for onboarding, empty states, and easter eggs.",
      whenToUse: [
        "An empty state would otherwise read as a failure",
        "Onboarding or a first-run screen needs a face",
        "A small easter egg, where §1.8's playfulness is welcome",
      ],
      whenNotToUse: [
        "It would be the only carrier of meaning — a mascot is decorative by rule",
        "The screen is dense with real information — §1.8 reserves it, not every screen",
        "You need a status marker or an icon — use a Badge for status, and slotted SVG for an icon; Taka is a character, not an icon set",
      ],
      accessibility:
        'Decorative always: `aria-hidden` on the host and `role="presentation"` on the `<svg>`, so a screen reader never announces it. The heading beside it does the talking. Artwork is drawn as SVG paths rather than imported, per §13\'s requirement that the mascot be original artwork. `mood` adds an idle animation that `prefers-reduced-motion` removes outright rather than shortening.',
      example: '<sk-taka mood="wave" size="lg"></sk-taka>',
      knownLimitations: [
        "Purely decorative — it must never be the only signal",
        "The `wave` and `bounce` moods animate and are cancelled under reduced motion",
      ],
    },
  },
  {
    name: "popover",
    tag: "sk-popover",
    stability: "stable",
    cssVariables: [
      "--sk-color-text",
      "--sk-duration-overlay",
      "--sk-ease-glass",
      "--sk-font-sans",
      "--sk-space-2",
      "--sk-space-4",
      "--sk-text-sm-line-height",
      "--sk-text-sm-size",
      "--sk-z-popover",
    ],
    ai: {
      summary: "A floating panel that holds controls, anchored to a trigger.",
      whenToUse: [
        "A button opens a small panel of controls, such as filters or a menu",
        "The panel content is interactive — links, checkboxes, a form",
        "The panel needs to close on Escape and on an outside click",
      ],
      whenNotToUse: [
        "The content is only a description of the trigger — use a Tooltip",
        "It must interrupt and demand a decision — use a Dialog",
        "The content is navigation beside the page — use a Drawer",
      ],
      accessibility:
        '`role="dialog"` on the panel, with `aria-haspopup="dialog"` and `aria-expanded` on the trigger — not `aria-describedby`, which would announce the whole panel as the trigger\'s description. Focus moves into the panel on open and returns to the trigger on close. Escape and an outside click both dismiss. Unlike a Tooltip, it takes pointer events, because it holds controls. `placement` is logical on the inline axis: `start` and `end` mirror under `dir="rtl"` (ADR-016).',
      example:
        '<sk-popover placement="bottom" label="Filters"><sk-button slot="trigger">Filters</sk-button><sk-checkbox label="Failed only"></sk-checkbox></sk-popover>',
      knownLimitations: [
        "The panel is rendered by Stencil with real `<slot>` elements — the consumer's children are never relocated, which is what keeps a click on slotted content inside the panel",
        "The flip at the viewport edge is computed for the block axis only; inline-axis placement does not flip",
      ],
    },
  },
  {
    name: "combobox",
    tag: "sk-combobox",
    stability: "stable",
    cssVariables: [
      "--sk-border-thick",
      "--sk-color-border-strong",
      "--sk-color-danger-fg",
      "--sk-color-primary",
      "--sk-color-primary-fg",
      "--sk-color-surface",
      "--sk-color-surface-sunken",
      "--sk-color-text",
      "--sk-color-text-muted",
      "--sk-font-sans",
      "--sk-space-1",
      "--sk-space-2",
      "--sk-space-3",
      "--sk-text-sm-line-height",
      "--sk-text-sm-size",
      "--sk-text-sm-weight",
      "--sk-text-xs-line-height",
      "--sk-text-xs-size",
      "--sk-text-xs-weight",
      "--sk-z-popover",
    ],
    ai: {
      summary: "A text field with a filterable list of options — type to narrow, arrows to choose.",
      whenToUse: [
        "There are more options than fit in a Select — roughly more than fifteen",
        "The reader may know part of the name and want to type it",
        "Options have labels the reader searches by, not just values",
      ],
      whenNotToUse: [
        "There are fewer than about eight options — use a Radio Group or Select",
        "Free text is a valid answer — use an Input",
        "Multiple selections are needed — use a multi-select pattern instead",
      ],
      accessibility:
        'The ARIA 1.2 combobox pattern: the input carries `role="combobox"` with `aria-expanded` and `aria-controls` naming the listbox, and **focus never leaves the input** — the active option is reported through `aria-activedescendant` instead. Moving focus into the list is the common mistake: it blurs the field the reader is typing into and every screen reader announces it as leaving. Arrows wrap rather than dead-ending. Escape closes without clearing the typed text, because closing is not the same command as reverting. `sk-value-change` fires only for a committed selection — typing filters and is not a value change (§4).',
      example:
        '<sk-combobox label="Country" options=\'[{"value":"id","label":"Indonesia"}]\'></sk-combobox>',
      knownLimitations: [
        "Matching is a plain case-insensitive substring — the wrong collation for some locales, and §6 leaves locale to the consumer, who may pass pre-filtered options",
        "No `aria-live` result count: it interrupts on every keystroke, and the listbox relationship already conveys the change",
        "SSR consumers must pass an explicit id — the counter differs between server and client",
      ],
    },
  },
  {
    name: "table",
    tag: "sk-table",
    stability: "stable",
    cssVariables: [
      "--sk-border-thick",
      "--sk-border-width",
      "--sk-color-border",
      "--sk-color-border-strong",
      "--sk-color-focus-ring",
      "--sk-color-shadow",
      "--sk-color-surface-raised",
      "--sk-color-surface-sunken",
      "--sk-color-text",
      "--sk-color-text-muted",
      "--sk-font-sans",
      "--sk-ring-offset",
      "--sk-ring-width",
      "--sk-shadow-brutal",
      "--sk-space-2",
      "--sk-space-3",
      "--sk-space-4",
      "--sk-text-sm-line-height",
      "--sk-text-sm-size",
      "--sk-text-xs-line-height",
      "--sk-text-xs-size",
      "--sk-text-xs-tracking",
      "--sk-text-xs-weight",
    ],
    ai: {
      summary: "A styled container for tabular data, which the consumer writes as a real table.",
      whenToUse: [
        "Tabular data where comparison down a column is the point",
        "The same data in a narrow viewport must scroll sideways without breaking the page",
        "The table needs the dense or striped treatment without hand-rolling it",
      ],
      whenNotToUse: [
        "It is a read-only summary of a few fields — use a Card",
        "The layout is a grid of unrelated panels — use Cards in a layout primitive",
        "There is one column and no comparison to make — use a list of Text rows",
      ],
      accessibility:
        'The consumer writes the semantics: `<caption>`, `<thead>`, and `<th scope>`. This element adds a scrollable region that is reachable from the keyboard and carries `role="group"` with an accessible name only when `label` is set — a scroll region a keyboard user cannot reach hides its own content. `label` names that region; it is not a substitute for a `<caption>`.',
      example:
        '<sk-table label="Deployments">\n  <table>\n    <caption>Deployments in the last 24 hours</caption>\n    <thead>\n      <tr><th scope="col">Build</th><th scope="col">Status</th></tr>\n    </thead>\n    <tbody>\n      <tr><td>4821</td><td>Live</td></tr>\n    </tbody>\n  </table>\n</sk-table>',
      knownLimitations: [
        "It does not sort, paginate, or read the rows: the table inside is the consumer's markup",
        "Sticky headers are not implemented — the scroll height belongs to the consumer's own container, so a sticky offset this element chose would be wrong",
      ],
    },
  },
]

/**
 * The starter blocks (ADR-022).
 *
 * A block is a page composition, not an element: markup that uses the custom
 * elements plus a stylesheet limited to layout. Only the prose is authored here.
 * The files, their checksums, the CSS variables the stylesheet reads, and — the
 * point — `registryDependencies` are all read from the block's own files, so an
 * entry cannot describe a block that is not there and a block cannot compose a
 * component it does not declare.
 */
const BLOCKS = [
  {
    name: "dashboard",
    ai: {
      summary:
        "An application shell with a navigation sidebar, a search header, summary cards, and a table of recent activity.",
      whenToUse: [
        "The first screen of an internal tool, where the shell matters more than any one panel",
        "You want the layout, the sidebar behaviour, and the responsive breakpoints already settled",
      ],
      whenNotToUse: [
        "It is a marketing page — use Button and link components, not the sidebar shell",
        "You only need the summary cards — take Card and write the grid yourself",
      ],
      accessibility:
        "The block is plain markup: the landmarks are the ones it writes (`<header>`, `<nav aria-label>`, `<main>`, `<section aria-labelledby>`), and the table carries a `<caption>`. Nothing in the block is keyboard-reachable that is not also labelled; the sidebar's links are real `<sk-link>` elements wrapping real `<a href>`, so they are in the tab order as links rather than as clickable boxes.",
      knownLimitations: [
        "The rows, counts, and progress values are placeholder markup: the block fetches nothing",
        "The sidebar is not collapsible and the block ships no JavaScript to make it so",
      ],
    },
  },
  {
    name: "settings",
    ai: {
      summary:
        "A settings form grouping account fields, a select, switches, and a checkbox, with a save action and an inline alert.",
      whenToUse: [
        "A preferences or account screen where the grouping and the save affordance are the work",
        "You want the label, description, and error wiring for each field already correct",
      ],
      whenNotToUse: [
        "A single field — use Input with a Label",
        "A multi-step flow — the block is one form and no wizard state",
      ],
      accessibility:
        'Every control is a labelled `<sk-input>`, `<sk-select>`, `<sk-switch>`, or `<sk-checkbox>`; the switches are named by the visible label and explained by the description text beside them rather than by a title attribute. The alert is a live region, so a validation message is announced when it appears. The save button is a real `<button type="submit">`, so Enter in a field submits the form.',
      knownLimitations: [
        "The form has no validation logic and no submit handler: the values are markup, not state",
        "Saving is not implemented — the button is a submit button waiting for the consumer's handler",
      ],
    },
  },
  {
    name: "authentication",
    ai: {
      summary:
        "A centred sign-in card: an email and password field, a remember-me checkbox, a submit button, a recovery link, and an error alert.",
      whenToUse: [
        "A sign-in, sign-up, or password-reset screen that needs the card, the fields, and the error state",
        "You want the error alert and the recovery link placed where a user looks for them",
      ],
      whenNotToUse: [
        "An in-app login dialog — use Alert Dialog",
        "A settings screen for an already signed-in user — use the settings block",
      ],
      accessibility:
        'The card is a single `<form>` with an accessible name from its heading; each field is labelled by a `<sk-label>` bound to it, and the password field declares `autocomplete="current-password"` so password managers and assistive technology recognise it. The error alert is a live region placed before the fields, and the recovery link is a real link rather than a button styled as one.',
      knownLimitations: [
        "Nothing is submitted and nothing is validated: the error alert demonstrates the state, it is not wired to a response",
        "There is no second-factor step, no OAuth buttons, and no password-strength meter",
      ],
    },
  },
]

for (const component of COMPONENTS) {
  // A component may ship more than one element: an accordion is useless without
  // its items, and tabs without a tab and a panel. `elements` names those extra
  // elements together with the directory they live in — the same directory as
  // the main element when they share one, as both of these do — so their files
  // are installed alongside it and their props are documented with it. Without
  // this, `cli add accordion` would install a group that renders nothing.
  const elements = [{ tag: component.tag, dir: component.tag }, ...(component.elements ?? [])]
  const files = elements.flatMap(({ dir, tag }) =>
    [
      { extension: "tsx", type: "registry:component" },
      { extension: "css", type: "registry:style" },
    ]
      // A member element may have no stylesheet of its own — its styles live in
      // the group's file — and listing a file that does not exist would make the
      // entry uninstallable.
      .filter(({ extension }) => existsSync(wcFile(dir, tag, extension)))
      .map(({ extension, type }) => ({
        path: `src/components/${dir}/${tag}.${extension}`,
        type,
        checksum: sha256(wcFile(dir, tag, extension)),
      })),
  )

  const entry = {
    $schema: "https://ui.santaka.my.id/schema/registry-item-v1.json",
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
    props: elements.flatMap(({ tag }) => propsFor(componentTypes, tag.slice(3))),
    // Every element is scanned for events, not just the one that names the
    // entry: `sk-open-change` is dispatched by the accordion *item*, and a
    // group-only scan would report that the accordion emits nothing.
    events: [
      ...new Set(
        elements.flatMap(({ dir, tag }) =>
          eventsFor(readFileSync(wcFile(dir, tag, "tsx"), "utf8"), eventMetadata),
        ),
      ),
    ].sort(),
    ai: { ...component.ai, localesCovered: ["en-US"] },
  }

  mkdirSync(outDir, { recursive: true })
  writeFileSync(join(outDir, `${component.name}.json`), `${JSON.stringify(entry, null, 2)}\n`)
  console.log(`[registry] wrote ${component.name}.json (${files.length} files)`)
}

console.log(`[registry] ${COMPONENTS.length} components at version ${version}`)

/**
 * Tag to entry name, for the main element and every compound part: a block that
 * writes `<sk-tab>` depends on the `tabs` entry, not on an entry called `tab`.
 */
const entryNameForTag = new Map()
for (const component of COMPONENTS) {
  entryNameForTag.set(component.tag, component.name)
  for (const element of component.elements ?? []) entryNameForTag.set(element.tag, component.name)
}

/** Every custom element the markup opens, in document order, without repeats. */
const composedTags = (html) => [
  ...new Set([...html.matchAll(/<(sk-[a-z0-9-]+)[\s>]/g)].map((match) => match[1])),
]

for (const block of BLOCKS) {
  const dir = join(wcRoot, "src", "blocks", block.name)
  const htmlPath = join(dir, `${block.name}.html`)
  const cssPath = join(dir, `${block.name}.css`)

  if (!existsSync(htmlPath)) {
    throw new Error(`[registry] block "${block.name}": no markup at ${htmlPath}`)
  }
  const html = readFileSync(htmlPath, "utf8")

  // Read from the markup rather than from a list beside it. A block that starts
  // composing a component and does not declare it is the drift this derivation
  // makes impossible, and a block that names an element with no entry is a block
  // that cannot be installed — both are build failures, not silent entries.
  const tags = composedTags(html)
  if (tags.length === 0) {
    throw new Error(`[registry] block "${block.name}": composes no custom elements`)
  }
  const dependencies = [
    ...new Set(
      tags.map((tag) => {
        const name = entryNameForTag.get(tag)
        if (!name) {
          throw new Error(
            `[registry] block "${block.name}": composes <${tag}>, which is not a registry entry`,
          )
        }
        return name
      }),
    ),
  ].sort()

  const files = [
    {
      path: `src/blocks/${block.name}/${block.name}.html`,
      type: "registry:block",
      checksum: sha256(htmlPath),
    },
    // The stylesheet is optional so a markup-only block can exist without an
    // empty file to satisfy the generator.
    ...(existsSync(cssPath)
      ? [
          {
            path: `src/blocks/${block.name}/${block.name}.css`,
            type: "registry:style",
            checksum: sha256(cssPath),
          },
        ]
      : []),
  ]

  // The tokens the stylesheet reads, scanned rather than authored: a hand-kept
  // list next to a stylesheet is a list that is wrong after the second edit.
  const cssVariables = existsSync(cssPath)
    ? [
        ...new Set(
          [...readFileSync(cssPath, "utf8").matchAll(/var\((--sk-[a-z0-9-]+)/g)].map(
            (match) => match[1],
          ),
        ),
      ].sort()
    : []

  const entry = {
    $schema: "https://ui.santaka.my.id/schema/registry-item-v1.json",
    schemaVersion: 1,
    name: block.name,
    namespace: null,
    type: "block",
    // HTML markup and layout CSS. A framework consumer can use it — the elements
    // are the same everywhere — but attribute names are not transformed for
    // JSX/Vue templates, so claiming per-framework support would overstate what
    // is shipped (ADR-022).
    frameworks: ["web-components"],
    stability: "stable",
    // A block owns no behavior: the elements it composes do (ADR-003).
    behaviorOwner: "framework-neutral",
    version,
    dependencies: {},
    peerDependencies: {},
    registryDependencies: dependencies,
    files,
    cssVariables,
    localesCovered: ["en-US"],
    license: "MIT",
    // No props and no events: both are optional in the schema for exactly this
    // item. The example is the block's own markup, so the entry cannot show a
    // page that has drifted from the one being installed.
    ai: { ...block.ai, example: html, localesCovered: ["en-US"] },
  }

  mkdirSync(outDir, { recursive: true })
  writeFileSync(join(outDir, `${block.name}.json`), `${JSON.stringify(entry, null, 2)}\n`)
  console.log(
    `[registry] wrote ${block.name}.json (${files.length} files, ${dependencies.length} dependencies)`,
  )
}

console.log(`[registry] ${BLOCKS.length} blocks at version ${version}`)
