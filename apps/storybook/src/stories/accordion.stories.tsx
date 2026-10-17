import { expect, waitFor, within } from "storybook/test"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { Accordion, AccordionItem } from "@santaka-ui/react"

/**
 * Stories for the compositional Accordion adapter.
 *
 * The base is the NATIVE `<details>`/`<summary>` pair: the browser owns the
 * disclosure semantics, the focus stop and Enter/Space, and the stories make
 * no attempt to re-draw that. Panels are plain children; `heading` is the
 * summary text; `open` mirrors `<details open>` and is reflected, so a single
 * item can start expanded.
 */
const meta = {
  title: "Components/Accordion",
  component: Accordion,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    multiple: {
      control: "boolean",
      description: "Whether several panels may be open at once. Default is exclusive.",
    },
    variant: {
      control: "select",
      options: ["default", "plain"],
      description: "`plain` drops the container chrome for nesting inside a Card.",
    },
    children: { control: false },
  },
} satisfies Meta<typeof Accordion>

export default meta
type Story = StoryObj<typeof meta>

/**
 * The default: exclusive single-open, closed item, and one item starting
 * `open` — the server-rendered already-expanded case the reflected attribute
 * exists for.
 */
export const Single: Story = {
  render: (args) => (
    <div style={{ maxWidth: "36rem" }}>
      <Accordion {...args}>
        <AccordionItem heading="What is this project?">
          <p style={{ margin: 0 }}>
            A workspace for documents, members, and settings. Everything here can be changed later.
          </p>
        </AccordionItem>
        <AccordionItem heading="Can I invite collaborators?" open>
          <p style={{ margin: 0 }}>
            Yes — new members receive edit access by default and can be changed later.
          </p>
        </AccordionItem>
        <AccordionItem heading="What happens to deleted documents?">
          <p style={{ margin: 0 }}>They are gone permanently. There is no recycle bin today.</p>
        </AccordionItem>
      </Accordion>
    </div>
  ),
}

/**
 * `multiple`: several panels may be open at once, and opening one does not
 * close the others.
 */
export const Multiple: Story = {
  args: { multiple: true },
  render: (args) => (
    <div style={{ maxWidth: "36rem" }}>
      <Accordion {...args}>
        <AccordionItem heading="Billing">
          <p style={{ margin: 0 }}>Invoices, payment methods, and plan changes.</p>
        </AccordionItem>
        <AccordionItem heading="Notifications">
          <p style={{ margin: 0 }}>Choose which events send email and which stay silent.</p>
        </AccordionItem>
        <AccordionItem heading="Security">
          <p style={{ margin: 0 }}>Session length, two-factor authentication, and audit logs.</p>
        </AccordionItem>
      </Accordion>
    </div>
  ),
}

/**
 * The `plain` variant: no stroked container or shadow, for an accordion
 * already inside a Card — the mirror of Card's `bare` reasoning.
 */
export const Plain: Story = {
  args: { variant: "plain" },
  render: (args) => (
    <div
      style={{
        maxWidth: "36rem",
        border: "var(--sk-border-thick, 3px) solid var(--sk-color-shadow, #17141C)",
        padding: "1rem",
      }}
    >
      <Accordion {...args}>
        <AccordionItem heading="What is this project?">
          <p style={{ margin: 0 }}>
            A workspace for documents, members, and settings. Everything here can be changed later.
          </p>
        </AccordionItem>
        <AccordionItem heading="Can I invite collaborators?">
          <p style={{ margin: 0 }}>
            Yes — new members receive edit access by default and can be changed later.
          </p>
        </AccordionItem>
      </Accordion>
    </div>
  ),
}

/**
 * Interaction test (plan.md §10): native `<details>` owns Enter and the
 * panel's `hidden` state, and the exclusive policy is the widget's real
 * behaviour — opening the last item must close the initially-open one. This
 * is the assertion a static screenshot cannot make.
 */
export const ExcludesSiblings: Story = {
  render: Single.render,
  play: async ({ canvasElement, userEvent }) => {
    const canvas = within(canvasElement)
    const initiallyOpen = await canvas.findByText(
      "Yes — new members receive edit access by default and can be changed later.",
    )
    // The paragraph is in the DOM a beat before the element upgrades and its
    // `<details>` takes the `open` the markup asked for, and this assertion has
    // no retry: measured, the canvas already has the text while `details.open`
    // is still false, so the one-shot read fails against an unupgraded element.
    await waitFor(() => expect(initiallyOpen).toBeVisible())

    const last = canvas.getByText("What happens to deleted documents?")
    await userEvent.click(last)

    // The exclusion write is imperative and lands synchronously; the panel's
    // own `open` attribute follows one render later. Wait for it rather than
    // sampling the intermediate frame.
    await waitFor(() => expect(initiallyOpen).not.toBeVisible())
    // The clicked panel's own open is the platform's, and its visibility is
    // therefore readable on the next turn — waited for rather than sampled.
    await waitFor(() =>
      expect(
        canvas.getByText("They are gone permanently. There is no recycle bin today."),
      ).toBeVisible(),
    )
  },
}

/**
 * Interaction test (plan.md §10) for `multiple`: two panels open at once,
 * which the exclusive default in `ExcludesSiblings` forbids — the one
 * behavioural difference between the two props.
 */
export const KeepsSiblingsOpen: Story = {
  args: { multiple: true },
  render: Multiple.render,
  play: async ({ canvasElement, userEvent }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByText("Billing"))
    await waitFor(() =>
      expect(canvas.getByText("Invoices, payment methods, and plan changes.")).toBeVisible(),
    )
    await userEvent.click(canvas.getByText("Security"))
    await waitFor(() =>
      expect(
        canvas.getByText("Session length, two-factor authentication, and audit logs."),
      ).toBeVisible(),
    )
    // Both stayed open — the `multiple` claim, asserted rather than assumed.
    await expect(canvas.getByText("Invoices, payment methods, and plan changes.")).toBeVisible()
  },
}
