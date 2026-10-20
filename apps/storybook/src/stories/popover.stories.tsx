import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, waitFor, within } from "storybook/test"
import { Button, Checkbox, Popover } from "@santaka-ui/react"

/**
 * Stories for the Popover adapter.
 *
 * A popover holds controls, so it takes focus and closes — unlike a tooltip,
 * which describes and takes none. That difference is what these show.
 *
 * `slot="trigger"` goes on a plain element, not on the Button adapter: slot
 * assignment is the browser's, and a React component prop would not reach the
 * DOM attribute that does it.
 */
const meta = {
  title: "Components/Popover",
  component: Popover,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    placement: {
      control: "inline-radio",
      options: ["top", "bottom", "start", "end"],
      description: "A hint, not a guarantee — it flips at the viewport edge.",
    },
    label: { control: "text" },
  },
  args: {
    placement: "bottom",
  },
} satisfies Meta<typeof Popover>

export default meta
type Story = StoryObj<typeof meta>

/** Opens below the trigger, holding interactive controls. */
export const Below: Story = {
  render: (args) => (
    <Popover {...args} label="Filters">
      <span slot="trigger">
        <Button variant="secondary">Filters</Button>
      </span>
      <Checkbox label="Failed only" />
      <Checkbox label="Last 24 hours" />
    </Popover>
  ),
  play: async ({ canvasElement, userEvent }) => {
    const canvas = within(canvasElement)
    // The element puts `aria-haspopup`/`aria-expanded` on the slotted trigger
    // itself, not the button inside it: slot assignment is the browser's, so this
    // mirrors what `popover.e2e.ts` asserts against real Chromium.
    const trigger = canvasElement.querySelector("[slot='trigger']") as HTMLElement

    // `aria-expanded` on the trigger is the state a screen reader announces, so
    // it — not the panel's visibility — is what the assertion reads.
    await waitFor(() => expect(trigger).toHaveAttribute("aria-expanded", "false"))
    trigger.click()
    await waitFor(() => expect(trigger).toHaveAttribute("aria-expanded", "true"))
    await waitFor(() => expect(canvas.getByText("Failed only")).toBeVisible())

    // Escape closes it again, without losing the state of the controls inside.
    await userEvent.keyboard("{Escape}")
    await waitFor(() => expect(trigger).toHaveAttribute("aria-expanded", "false"))
    await waitFor(() => expect(canvas.getByText("Failed only")).not.toBeVisible())
  },
}

/** Opens on the logical start edge, which mirrors under `dir="rtl"`. */
export const FromStart: Story = {
  args: { placement: "start" },
  render: (args) => (
    <Popover {...args} label="Actions">
      <span slot="trigger">
        <Button variant="ghost">Actions</Button>
      </span>
      <p>Logical sides mirror in a right-to-left document.</p>
    </Popover>
  ),
}

/** Opens above the trigger. */
export const Above: Story = {
  args: { placement: "top" },
  render: (args) => (
    <Popover {...args} label="Details">
      <span slot="trigger">
        <Button variant="outline">Details</Button>
      </span>
      <p>Closes on Escape and on an outside click.</p>
    </Popover>
  ),
}
