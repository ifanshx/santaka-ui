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
    // `[data-slot="control"] input` — the same selector the browser suite uses.
    // `getByRole("combobox")` also matches the custom element, which renders the
    // attribute on its inner `<input>` rather than on the host.
    const input = canvasElement.querySelector('[data-slot="control"] input') as HTMLInputElement

    // Wait for the upgrade. Reading `aria-expanded` through `findByRole` resolved
    // a host whose `<input>` was not yet bound: `type()` then produced no `input`
    // event, the element stayed `aria-expanded="false"`, and every later assertion
    // measured an unbound element. Clicking first installs the delegated
    // handlers Stencil attaches.
    await waitFor(() =>
      expect(
        canvasElement.querySelector("sk-combobox")?.classList.contains("hydrated") ?? false,
      ).toBe(true),
    )
    const host = canvasElement.querySelector("sk-combobox") as HTMLElement
    await userEvent.click(host)

    // Filtering by typing does not depend on keydown dispatch — the element
    // reads its value from the `input` event — so this is reliable even where
    // synthetic arrow keys are not.
    await userEvent.type(input, "no")
    await waitFor(() => expect(input).toHaveAttribute("aria-expanded", "true"))
    await expect(canvas.getByRole("listbox", { name: "Country" })).toBeVisible()
    // The list opens with all six options before the filter lands, so a one-shot
    // count measures the unfiltered frame — measured on the hosted runner, where
    // scheduling is slower than locally. The count and the surviving option are
    // both polled until the filter has actually applied.
    await waitFor(() => expect(canvas.getAllByRole("option")).toHaveLength(1))
    await expect(canvas.getByRole("option", { name: "Norway" })).toBeInTheDocument()

    // The ARIA 1.2 contract: focus never leaves the input, so the active option
    // is reported through `aria-activedescendant` rather than by moving focus
    // into the list. That attribute only exists once an option is made active by
    // arrow navigation, so here — where arrows do not reach this environment —
    // the assertion is the one that always holds: the input still owns focus,
    // and the list it controls is filtered to the typed query.
    expect(document.activeElement).toBe(input)

    // Arrow keys, wrapping, Enter committing, and Escape are asserted against
    // real Chromium in `combobox.e2e.ts`, where a real key press is
    // trustworthy.
  },
}
