import type { Meta, StoryObj } from "@storybook/react-vite"
import { Card } from "@santaka-ui/react"

/**
 * Stories for the Card adapter. Every control is a real prop: `variant`,
 * `padding`, `heading`, and `subtitle`, with `slot="header"` / `slot="footer"`
 * children slotted by the browser (React renders light DOM, no Slot wrapper).
 */
const meta = {
  title: "Components/Card",
  component: Card,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "outlined", "bare"],
      description: "Visual emphasis. `outlined` drops the fill; `bare` drops fill and shadow.",
    },
    padding: {
      control: "inline-radio",
      options: ["none", "sm", "md", "lg"],
      description: "Inner padding. Not `size`: a card has no intrinsic height to scale.",
    },
    heading: {
      control: "text",
      description:
        "Plain-text heading in the header slot's fallback. For real headings, use a header slot child.",
    },
    subtitle: {
      control: "text",
      description: "Supporting text under the heading.",
    },
  },
  args: {
    variant: "default",
    padding: "md",
    heading: "Card heading",
    subtitle: "Supporting text under the heading.",
  },
} satisfies Meta<typeof Card>

export default meta
type Story = StoryObj<typeof meta>

/** The default: default variant, medium padding, heading and subtitle. */
export const Default: Story = {}

export const Outlined: Story = { args: { variant: "outlined" } }
export const Bare: Story = { args: { variant: "bare" } }

/** All variants side by side, to check they read as one family. */
export const AllVariants: Story = {
  render: () => (
    <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
      <div style={{ width: 220 }}>
        <Card heading="Default" subtitle="Fill and shadow." />
      </div>
      <div style={{ width: 220 }}>
        <Card variant="outlined" heading="Outlined" subtitle="Border, no fill." />
      </div>
      <div style={{ width: 220 }}>
        <Card variant="bare" heading="Bare" subtitle="No fill, no shadow." />
      </div>
    </div>
  ),
}

/** All padding steps side by side. */
export const AllPadding: Story = {
  render: () => (
    <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
      {(["none", "sm", "md", "lg"] as const).map((p) => (
        <Card key={p} padding={p} heading={p}>
          Body content padded with `{p}`.
        </Card>
      ))}
    </div>
  ),
}

/**
 * Heading and subtitle via props — for plain text only. When the heading must
 * be a real heading element for the document outline, use the header slot
 * instead (see `WithSlots`).
 */
export const HeadingAndSubtitle: Story = {
  args: {
    heading: "Storage almost full",
    subtitle: "Your workspace is using 96% of its quota.",
  },
}

/**
 * A card with real body content plus explicit `slot="header"` and
 * `slot="footer"` children. The header slot takes a real `<h3>`, because the
 * card does not know its heading level in your document outline.
 */
export const WithBodyContent: Story = {
  render: () => (
    <div style={{ width: 360 }}>
      <Card>
        <h3 slot="header" style={{ margin: 0 }}>
          Team members
        </h3>
        <p style={{ margin: 0 }}>
          Invite colleagues to collaborate on this workspace. New members receive edit access by
          default and can be changed later.
        </p>
        <div slot="footer" style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
          <button type="button">Cancel</button>
          <button type="button">Send invites</button>
        </div>
      </Card>
    </div>
  ),
}
