import type { Meta, StoryObj } from "@storybook/react-vite"
import { Separator } from "@santaka-ui/react"

/**
 * Stories for the Separator adapter. No children — a separator has no content;
 * the `<hr>` is the element. Real props only: `orientation`, `decorative`,
 * `label`. Vertical separators need a sized parent, which the stories provide.
 */
const meta = {
  title: "Components/Separator",
  component: Separator,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    orientation: {
      control: "inline-radio",
      options: ["horizontal", "vertical"],
      description: "Axis of the line. Vertical separators need a sized parent.",
    },
    decorative: {
      control: "boolean",
      description: "Purely visual: removes the element from the accessibility tree.",
    },
    label: {
      control: "text",
      description: 'Label for a meaningful separator, e.g. "or" between two actions.',
    },
  },
  args: {
    orientation: "horizontal",
    decorative: false,
  },
} satisfies Meta<typeof Separator>

export default meta
type Story = StoryObj<typeof meta>

/** The default: horizontal, meaningful (announced to assistive technology). */
export const Horizontal: Story = {
  render: () => (
    <div style={{ width: 320 }}>
      <p style={{ margin: "0 0 0.75rem" }}>Content above the line.</p>
      <Separator />
      <p style={{ margin: "0.75rem 0 0" }}>Content below the line.</p>
    </div>
  ),
}

/**
 * Vertical, inside a fixed-height flex container — a vertical line has no
 * height to draw unless its parent is sized.
 */
export const Vertical: Story = {
  render: () => (
    <div style={{ display: "flex", height: 96, gap: "1rem", alignItems: "stretch" }}>
      <span>Left</span>
      <Separator orientation="vertical" />
      <span>Right</span>
    </div>
  ),
}

/**
 * A labelled separator: the label is meaningful, so the separator stays in the
 * accessibility tree and announces it.
 */
export const Labelled: Story = {
  render: () => (
    <div style={{ display: "flex", width: 320, gap: "0.75rem", alignItems: "center" }}>
      <Separator />
      <Separator orientation="horizontal" label="or" />
      <Separator />
    </div>
  ),
}

/** `decorative` removes the element from the accessibility tree. */
export const Decorative: Story = {
  render: () => (
    <div style={{ width: 320 }}>
      <p style={{ margin: "0 0 0.75rem" }}>Section one.</p>
      <Separator decorative />
      <p style={{ margin: "0.75rem 0 0" }}>Section two.</p>
    </div>
  ),
}
