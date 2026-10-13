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
