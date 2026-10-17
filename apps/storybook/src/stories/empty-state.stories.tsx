import { expect, within } from "storybook/test"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { EmptyState } from "@santaka-ui/react"

/**
 * EmptyState stories.
 *
 * A placeholder surface, not a control: no role and no focus stop, the same
 * position Card takes toward its content. Heading and description are plain
 * text; the section heading itself is the document's business. `variant=
 * "bare"` exists for an empty state inside a Card, where two stroked surfaces
 * would fight over the same wall.
 */
const meta = {
  title: "Components/EmptyState",
  component: EmptyState,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "bare"],
      description: "`bare` drops the fill, stroke and shadow for nesting inside another surface.",
    },
    size: {
      control: "inline-radio",
      options: ["sm", "md", "lg"],
      description: "Block padding and glyph size.",
    },
    heading: {
      control: "text",
      description: "Plain-text heading rendered as a `<span>`, never a heading element.",
    },
    description: {
      control: "text",
      description: "Supporting text under the heading.",
    },
    children: { control: false },
  },
  args: {
    variant: "default",
    size: "md",
    heading: "Nothing here yet",
    description: "Items you create will show up in this space.",
  },
} satisfies Meta<typeof EmptyState>

export default meta
type Story = StoryObj<typeof meta>

/** The default: stroked surface, CSS-drawn glyph fallback, heading and description. */
export const Default: Story = {}

/** All sizes side by side. Padding and glyph size are the only changes. */
export const AllSizes: Story = {
  render: (args) => (
    <div style={{ display: "grid", gap: "1rem", justifyItems: "stretch" }}>
      <EmptyState {...args} size="sm" heading="Small" />
      <EmptyState {...args} size="md" heading="Medium" />
      <EmptyState {...args} size="lg" heading="Large" />
    </div>
  ),
}

/**
 * The bare variant for nesting: no second boundary inside a Card's stroke.
 * Shown here inside a `sk-card`-shaped surface by plain styling, because the
 * nesting is the story, not the host.
 */
export const Bare: Story = {
  args: {
    variant: "bare",
    heading: "No members yet",
    description: "Invite colleagues to collaborate.",
  },
  render: (args) => (
    <div
      style={{
        border: "var(--sk-border-thick, 3px) solid var(--sk-color-shadow, #17141C)",
        padding: "1rem",
        maxWidth: "32rem",
      }}
    >
      <EmptyState {...args} />
    </div>
  ),
}

/**
 * Heading and description via props cover the plain-text case; body content
 * and an `actions` slot are what a stateful empty page actually ships — the
 * actions are what get the user out of the empty state, so they are reachable,
 * visible, and in the flow.
 */
export const WithActions: Story = {
  render: () => (
    <div style={{ maxWidth: "32rem" }}>
      <EmptyState
        heading="No projects yet"
        description="Create your first project to start collaborating."
      >
        <p style={{ margin: 0 }}>
          Projects group documents, members, and settings. You can change any of that later.
        </p>
        <div slot="actions" style={{ display: "flex", gap: "0.5rem" }}>
          <button type="button">Create project</button>
          <button type="button">Read the guide</button>
        </div>
      </EmptyState>
    </div>
  ),
}

/**
 * Interaction test (plan.md §10): the component owns no state and takes no
 * focus, so the one behavioural claim the markup cannot show statically is
 * that nothing here is in the tab order for a keyboard-only reader — the
 * buttons are, and they land in the actions wrapper, not loose in the body.
 */
export const ActionsAreReachable: Story = {
  render: WithActions.render,
  play: async ({ canvasElement, userEvent }) => {
    const canvas = within(canvasElement)
    const create = canvas.getByRole("button", { name: "Create project" })
    await userEvent.tab()
    await expect(create).toHaveFocus()
  },
}
