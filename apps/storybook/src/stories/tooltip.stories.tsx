import type { Meta, StoryObj } from "@storybook/react-vite"
import { Button, Tooltip, TooltipTrigger } from "@santaka-ui/react"

/**
 * Tooltip stories.
 *
 * The trigger must be a focusable element — a non-interactive span gives
 * keyboard users nothing to describe — so every `TooltipTrigger` wraps a
 * real Button from `@santaka-ui/react`. Hover or focus shows the tooltip;
 * `open: true` stories show it immediately for review without interaction.
 */
const meta = {
  title: "Components/Tooltip",
  component: Tooltip,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    open: {
      control: "boolean",
      description: "Force the tooltip open regardless of hover or focus.",
    },
    placement: {
      control: "select",
      options: ["top", "bottom", "left", "right"],
      description: "Preferred side. Flips at the viewport edge rather than clipping.",
    },
    delay: {
      control: "number",
      description:
        "Milliseconds of hover before showing. A tooltip that fires instantly is a strobe.",
    },
  },
  args: {
    placement: "top",
    delay: 300,
  },
} satisfies Meta<typeof Tooltip>

export default meta
type Story = StoryObj<typeof meta>

/** The default: above the trigger, after a short hover delay. */
export const Top: Story = {
  render: (args) => (
    <Tooltip {...args}>
      <TooltipTrigger>
        <Button variant="ghost">Save</Button>
      </TooltipTrigger>
      Save your draft (Ctrl+S)
    </Tooltip>
  ),
}

export const Bottom: Story = {
  args: { placement: "bottom" },
  render: (args) => (
    <Tooltip {...args}>
      <TooltipTrigger>
        <Button variant="ghost">Share</Button>
      </TooltipTrigger>
      Copy a read-only link
    </Tooltip>
  ),
}

export const Left: Story = {
  args: { placement: "left" },
  render: (args) => (
    <Tooltip {...args}>
      <TooltipTrigger>
        <Button variant="ghost">Undo</Button>
      </TooltipTrigger>
      Revert the last edit (Ctrl+Z)
    </Tooltip>
  ),
}

export const Right: Story = {
  args: { placement: "right" },
  render: (args) => (
    <Tooltip {...args}>
      <TooltipTrigger>
        <Button variant="ghost">Delete</Button>
      </TooltipTrigger>
      Move to trash — recoverable for 30 days
    </Tooltip>
  ),
}

/** All four placements side by side, around a shared trigger button. */
export const AllPlacements: Story = {
  render: (args) => (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "auto auto",
        gap: "1.5rem",
        justifyContent: "center",
        padding: "3rem",
      }}
    >
      <Tooltip {...args} placement="left">
        <TooltipTrigger>
          <Button variant="ghost">Left tooltip</Button>
        </TooltipTrigger>
        Appears to the left
      </Tooltip>
      <Tooltip {...args} placement="right">
        <TooltipTrigger>
          <Button variant="ghost">Right tooltip</Button>
        </TooltipTrigger>
        Appears to the right
      </Tooltip>
      <Tooltip {...args} placement="top">
        <TooltipTrigger>
          <Button variant="ghost">Top tooltip</Button>
        </TooltipTrigger>
        Appears above
      </Tooltip>
      <Tooltip {...args} placement="bottom">
        <TooltipTrigger>
          <Button variant="ghost">Bottom tooltip</Button>
        </TooltipTrigger>
        Appears below
      </Tooltip>
    </div>
  ),
}

/**
 * `open: true` — shown immediately so a reviewer sees the tooltip without
 * hovering or focusing. A controlled open value wins over the delay.
 */
export const ForcedOpen: Story = {
  args: { open: true },
  render: (args) => (
    <Tooltip {...args}>
      <TooltipTrigger>
        <Button>Publish</Button>
      </TooltipTrigger>
      Goes live immediately; subscribers are notified
    </Tooltip>
  ),
}

/** A long `delay` for tooltips that would otherwise strobe on a toolbar. */
export const LongDelay: Story = {
  args: { delay: 1500 },
  render: (args) => (
    <Tooltip {...args}>
      <TooltipTrigger>
        <Button variant="ghost">Format</Button>
      </TooltipTrigger>
      Hold the pointer a moment — 1.5s delay
    </Tooltip>
  ),
}
