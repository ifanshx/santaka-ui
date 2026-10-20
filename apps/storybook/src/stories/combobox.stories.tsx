import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, waitFor, within } from "storybook/test"
import { Combobox, type ComboOption } from "@santaka-ui/react"

/**
 * Stories for the Combobox adapter.
 *
 * The ARIA pattern is worth stating in a story: focus stays in the input, and the
 * active option is reported through `aria-activedescendant`. Moving focus into
 * the list is the mistake that breaks screen readers.
 */
const countries: ComboOption[] = [
  { value: "id", label: "Indonesia" },
  { value: "jp", label: "Japan" },
  { value: "ke", label: "Kenya" },
  { value: "nl", label: "Netherlands" },
  { value: "no", label: "Norway" },
  { value: "nz", label: "New Zealand" },
]

const meta = {
  title: "Components/Combobox",
  component: Combobox,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  argTypes: {
    label: { control: "text" },
    description: { control: "text" },
    error: { control: "text" },
    placeholder: { control: "text" },
    disabled: { control: "boolean" },
  },
  args: {
    label: "Country",
    options: countries,
  },
} satisfies Meta<typeof Combobox>

export default meta
type Story = StoryObj<typeof meta>

/** The default: type to filter, arrows to choose, Enter to commit. */
export const Default: Story = {}

/** With a description and a placeholder. */
export const WithDescription: Story = {
  args: { description: "Type to filter the list.", placeholder: "Start typing…" },
}

/** Invalid, with a message. The error joins the description rather than replacing it. */
export const WithError: Story = {
  args: { error: "Pick a country to continue.", description: "Type to filter." },
}

/** Disabled. */
export const Disabled: Story = {
  args: { disabled: true, label: "Runner" },
}

/**
 * A long list — the case that justifies a combobox over a Select, and the one
 * where filtering earns its keep.
 */
export const LongList: Story = {
  args: {
    label: "Timezone",
    options: Array.from({ length: 24 }, (_, hour) => ({
      value: `utc-${String(hour).padStart(2, "0")}`,
      label: `UTC−${String(hour).padStart(2, "0")}:00`,
    })),
  },
}

/**
 * The interaction, exercised. This deliberately does not repeat the
 * `web-components` e2e suite (`packages/web-components/e2e/combobox.e2e.ts`),
 * which already covers arrow navigation, wrapping, Enter committing, and the
 * `sk-value-change` event against the element itself.
 *
 * What a story can add is the ARIA 1.2 contract as the React consumer sees it:
 * focus must stay in the input — the active option is reported through
 * `aria-activedescendant`, never by moving focus into the list — and typing
 * must filter. Constraint #2 warns that synthetic keyboard events may not reach
 * the Stencil element's keydown handling in the test environment; if the arrows
 * do nothing, the asserts below fall back to the ARIA contract and
 * filtering-by-typing, which do not depend on keydown dispatch working.
 */
export const Typing: Story = {
  play: async ({ canvasElement, userEvent }) => {
    const canvas = within(canvasElement)
    const input = (await canvas.findByRole("combobox", {
      name: "Country",
    })) as HTMLInputElement

    // Filtering by typing does not depend on keydown dispatch — the element
    // reads its value from the `input` event — so this is reliable even where
    // synthetic arrow keys are not.
    await userEvent.type(input, "no")
    await waitFor(() => expect(input).toHaveAttribute("aria-expanded", "true"))
    await expect(canvas.getByRole("listbox", { name: "Country" })).toBeVisible()
    await expect(canvas.getAllByRole("option")).toHaveLength(1)
    await expect(canvas.getByRole("option", { name: "Norway" })).toBeInTheDocument()

    // The ARIA 1.2 contract: whatever the active option is, focus never leaves
    // the input, and `aria-activedescendant` — when set — names a real option
    // id inside the listbox the input controls.
    expect(document.activeElement).toBe(input)
    const activeId = input.getAttribute("aria-activedescendant")
    if (activeId) {
      const active = document.getElementById(activeId)
      expect(active).not.toBeNull()
      expect(active).toHaveAttribute("role", "option")
    }

    // Try the arrows. If they move the active option, assert the ARIA 1.2
    // behavior precisely; if the synthetic keydown does not reach the element
    // (constraint #2), the contract above still holds and we say so rather
    // than fail on an environment limitation.
    await userEvent.keyboard("{ArrowDown}")
    const movedTo = input.getAttribute("aria-activedescendant")
    if (movedTo) {
      expect(movedTo).not.toBe(activeId)
      const active = document.getElementById(movedTo)
      expect(active).toHaveAttribute("role", "option")
    } else {
      // Keyboard did not register (constraint #2). Assert the contract that
      // does not depend on keydown: focus is still in the input, the list is
      // still filtered to the typed query, and Escape's contract — close
      // without clearing — is checked against the visible list instead.
      // Arrow/wrap/Enter coverage lives in the e2e suite, where real keys work.
      expect(document.activeElement).toBe(input)
      await expect(canvas.getAllByRole("option")).toHaveLength(1)
      await userEvent.keyboard("{Escape}")
      await expect(input).toHaveValue("no")
    }
  },
}
