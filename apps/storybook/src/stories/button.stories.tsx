import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, fn, within } from "storybook/test"
import { Button } from "@santaka-ui/react"

/**
 * The reference story for the workshop.
 *
 * Two things are deliberate here and copied by every other story file:
 *
 * 1. The import is `@santaka-ui/react` — the published entry point, not
 *    `packages/react/src`. A workshop that reaches into source can render a
 *    component a consumer could not import.
 * 2. Every control is a real prop of the adapter, typed in the package. There
 *    is no story-local prop and no `argTypes` override inventing a name the
 *    component does not accept.
 */
const meta = {
  title: "Components/Button",
  component: Button,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "secondary", "outline", "ghost", "danger"],
      description: "Visual weight. The only visual prop besides `size`.",
    },
    size: {
      control: "inline-radio",
      options: ["sm", "md", "lg"],
    },
    type: {
      control: "inline-radio",
      options: ["button", "submit", "reset"],
      description: "Form semantics, forwarded to the underlying `<button>`.",
    },
    disabled: { control: "boolean" },
    loading: {
      control: "boolean",
      description: "Sets `aria-busy` and blocks activation while work is in flight.",
    },
    children: { control: "text" },
  },
  args: {
    children: "Save changes",
    variant: "primary",
    size: "md",
    type: "button",
    disabled: false,
    loading: false,
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

/** The default: primary, medium, enabled. */
export const Primary: Story = {}

export const Secondary: Story = { args: { variant: "secondary" } }
export const Outline: Story = { args: { variant: "outline" } }
export const Ghost: Story = { args: { variant: "ghost" } }
export const Danger: Story = { args: { variant: "danger" } }

/**
 * All five variants side by side. A per-variant story answers "does this one
 * look right"; this answers "do they read as one family", which is the question
 * a design review actually asks.
 */
export const AllVariants: Story = {
  render: (args) => (
    <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
      <Button {...args} variant="primary">
        Primary
      </Button>
      <Button {...args} variant="secondary">
        Secondary
      </Button>
      <Button {...args} variant="outline">
        Outline
      </Button>
      <Button {...args} variant="ghost">
        Ghost
      </Button>
      <Button {...args} variant="danger">
        Danger
      </Button>
    </div>
  ),
}

export const AllSizes: Story = {
  render: (args) => (
    <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
      <Button {...args} size="sm">
        Small
      </Button>
      <Button {...args} size="md">
        Medium
      </Button>
      <Button {...args} size="lg">
        Large
      </Button>
    </div>
  ),
}

/** `loading` sets `aria-busy` and blocks activation — not just a spinner. */
export const Loading: Story = { args: { loading: true } }

/** `disabled` is a real attribute, so the control leaves the tab order. */
export const Disabled: Story = { args: { disabled: true } }

/**
 * A long label. The button must grow or wrap without clipping its own focus
 * ring, which is the failure a short-label-only set of stories never shows.
 */
export const LongLabel: Story = {
  args: {
    children:
      "Export every selected repository as a signed archive and email the manifest to the maintainers",
  },
}

/**
 * Interaction test (plan.md §10, "controls and interaction tests for
 * interactive components"). A reviewer can read the assertions and watch them
 * run in the Interactions panel; CI runs them for real through
 * `@storybook/addon-vitest` (`apps/storybook/vitest.config.ts`).
 *
 * The adapter's own unit tests prove `onClick` is wired in jsdom; this proves
 * it in a browser against the real custom element, which is the layer the
 * story renders.
 */
export const Clickable: Story = {
  args: { onClick: fn() },
  play: async ({ args, canvasElement, userEvent }) => {
    const canvas = within(canvasElement)
    // `findByRole` retries: the custom element's `role="button"` is written in
    // componentDidLoad, which is a tick after the host appears.
    const button = await canvas.findByRole("button", { name: "Save changes" })
    await userEvent.click(button)
    await expect(args.onClick).toHaveBeenCalledTimes(1)
  },
}
