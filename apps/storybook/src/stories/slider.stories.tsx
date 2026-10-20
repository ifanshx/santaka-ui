import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, within } from "storybook/test"
import { Slider } from "@santaka-ui/react"

/**
 * Stories for the Slider adapter.
 *
 * The element renders a real `<input type="range">`, so the keyboard model is the
 * platform's — which is the story worth telling here, and the reason there is no
 * controlled/uncontrolled split in this adapter.
 */
const meta = {
  title: "Components/Slider",
  component: Slider,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  argTypes: {
    label: { control: "text" },
    description: { control: "text" },
    error: { control: "text" },
    value: { control: { type: "range", min: 0, max: 100, step: 1 } },
    min: { control: "number" },
    max: { control: "number" },
    step: { control: "number" },
    showValue: { control: "boolean" },
    disabled: { control: "boolean" },
  },
  args: {
    label: "Volume",
    value: 40,
    min: 0,
    max: 100,
    step: 1,
  },
} satisfies Meta<typeof Slider>

export default meta
type Story = StoryObj<typeof meta>

/** The default: a label and a value. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    // `findByRole`, not `getByRole`: the element upgrades asynchronously and its
    // inner `<input type="range">` does not exist until it has. A one-shot read
    // against an unupgraded host is the failure this replaces.
    const input = await canvas.findByRole("slider", { name: "Volume" })

    // The role coming from a real range input is the claim the adapter makes —
    // the platform owns the keyboard model rather than this library
    // reimplementing it. The keyboard model itself is asserted against real
    // Chromium in `slider.e2e.ts`, which is where an arrow key is trustworthy;
    // duplicating it here would test Storybook's event plumbing instead.
    await expect(input).toHaveValue("40")

    // The label must reach the control, or a screen reader announces a bare
    // number with no name — the accessible name is part of the query above.
    await expect(input).toHaveAttribute("type", "range")
  },
}

/** With the numeric output shown beside the label. */
export const WithValue: Story = {
  args: { showValue: true, format: "$v of $m" },
  play: async ({ canvasElement }) => {
    // `aria-valuetext` is the whole point of `format`: without it a screen reader
    // announces "40" where the design says "40 of 100". The consumer's pattern
    // string is applied by the element, so this asserts the substitution reached
    // the accessibility tree rather than only the visible text.
    const input = await within(canvasElement).findByRole("slider", { name: "Volume" })
    await expect(input).toHaveAttribute("aria-valuetext", "40 of 100")
  },
}

/** With a description. Announced through `aria-describedby`. */
export const WithDescription: Story = {
  args: { description: "Lowercase letters and dashes." },
}

/**
 * With an error. The description stays in `aria-describedby` alongside the error,
 * so the hint is not lost at the moment it is needed.
 */
export const WithError: Story = {
  args: { description: "At least 20.", error: "Budget must be at least 20.", value: 10 },
}

/** Disabled. */
export const Disabled: Story = {
  args: { disabled: true, label: "Retention", value: 30 },
}

/** A coarser step, on a wider range. */
export const Stepped: Story = {
  args: { label: "Monthly budget", min: 0, max: 200, step: 10, value: 80, showValue: true },
}
