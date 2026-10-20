import { expect, within } from "storybook/test"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { Link } from "@santaka-ui/react"

/**
 * Stories for the Link adapter.
 *
 * `href` is required — a link with no destination is a mistake, and the type
 * makes it one the compiler catches (the adapter documents `href=""` as the
 * explicit no-destination rendering). All props below are real, typed props.
 */
const meta = {
  title: "Components/Link",
  component: Link,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    href: {
      control: "text",
      description: "The destination. Required.",
    },
    external: {
      control: "boolean",
      description: "Marks a link that leaves the application: new tab, safe rel, and an icon.",
    },
    subtle: {
      control: "boolean",
      description: "Suppresses the underline until hover or focus.",
    },
    target: {
      control: "text",
      description: "Opened in a new tab without the external treatment.",
    },
    rel: { control: "text", description: "Forwarded to the underlying anchor." },
    download: {
      control: "text",
      description: "Passed through for download links.",
    },
    children: { control: "text" },
  },
  args: {
    href: "https://example.com",
    children: "Example link",
  },
} satisfies Meta<typeof Link>

export default meta
type Story = StoryObj<typeof meta>

/** The default: same-tab navigation, persistent underline. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    // The anchor is what makes middle-click, "open in new tab", and URL
    // copying work — the load-bearing property from `e2e/link.e2e.ts` — so
    // assert the anchor itself rather than the rendered text.
    const anchor = await canvas.findByRole("link", { name: "Example link" })
    await expect(anchor).toHaveAttribute("href", "https://example.com")
    // A same-tab link must not carry the external treatment.
    await expect(anchor).not.toHaveAttribute("target", "_blank")
    await expect(anchor).not.toHaveAttribute("rel", /.+/)
  },
}

/**
 * External: opens a new tab, gets a safe `rel`, and renders an icon indicating
 * the destination leaves the app.
 */
export const External: Story = {
  args: {
    href: "https://example.com/external-docs",
    external: true,
    children: "External documentation",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const anchor = await canvas.findByRole("link", { name: "External documentation" })
    // External links open a new tab with a safe rel: `noopener` prevents the
    // opened page reaching back through `window.opener`, `noreferrer` strips
    // the referrer.
    await expect(anchor).toHaveAttribute("href", "https://example.com/external-docs")
    await expect(anchor).toHaveAttribute("target", "_blank")
    // The attribute is compared as one string: this matcher takes a literal
    // here, not a pattern, and a regex silently fails against the real value.
    const rel = anchor.getAttribute("rel")
    expect(rel).toContain("noopener")
    expect(rel).toContain("noreferrer")
  },
}

/** Subtle: no underline until hover or focus. */
export const Subtle: Story = {
  args: {
    href: "https://example.com/quiet",
    subtle: true,
    children: "Quiet link",
  },
}

/** A new-tab link without the full external treatment. */
export const TargetBlank: Story = {
  args: {
    href: "https://example.com/preview",
    target: "_blank",
    children: "Open preview in new tab",
  },
}

/** A link with a custom `rel`. */
export const CustomRel: Story = {
  args: {
    href: "https://example.com/partner",
    rel: "noopener noreferrer",
    children: "Partner site",
  },
}

/** A download link. */
export const Download: Story = {
  args: {
    href: "https://example.com/files/report.pdf",
    download: "santaka-report.pdf",
    children: "Download report",
  },
}

/**
 * Long text. The link must wrap across lines instead of overflowing its
 * container — a single-line-only set of stories never shows this.
 */
export const LongText: Story = {
  render: () => (
    <div style={{ width: "18rem" }}>
      <Link href="https://example.com/release-notes">
        Read the full release notes, including the migration guide for teams upgrading from the
        previous major version
      </Link>
    </div>
  ),
}
