import { expect, within } from "storybook/test"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { Table } from "@santaka-ui/react"

/**
 * Stories for the Table adapter.
 *
 * A skin over a table the consumer authors, not a table builder: no column
 * config, no data prop, no cell rendering. The consumer writes the real
 * `<table>`, `<caption>`, `<th scope>` and `<tbody>`; the component supplies
 * the container, the horizontal overflow, the style, and a keyboard-focusable
 * scroll region (`tabindex="0"`) that carries `role="group"` and a name only
 * when `label` is supplied.
 */
const meta = {
  title: "Components/Table",
  component: Table,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "plain"],
      description: "`plain` drops the container chrome for a table inside a Card.",
    },
    density: {
      control: "select",
      options: ["default", "compact"],
      description: "Cell padding, not a height scale — a table is whatever its rows make it.",
    },
    striped: {
      control: "boolean",
      description: "Zebra rows: even body rows take the sunken surface.",
    },
    label: {
      control: "text",
      description: 'Name of the scroll region; names it as `role="group"` when set.',
    },
    children: { control: false },
  },
} satisfies Meta<typeof Table>

export default meta
type Story = StoryObj<typeof meta>

/**
 * The consumer's own table markup — a real `<caption>` and `<th scope>` are
 * the component's accessibility story, not something it can reimplement.
 */
const invoiceTable = (
  <table>
    <caption>Recent invoices</caption>
    <thead>
      <tr>
        <th scope="col">Invoice</th>
        <th scope="col">Date</th>
        <th scope="col">Amount</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>INV-0142</td>
        <td>May 4</td>
        <td>$1,200.00</td>
      </tr>
      <tr>
        <td>INV-0141</td>
        <td>Apr 4</td>
        <td>$1,200.00</td>
      </tr>
      <tr>
        <td>INV-0140</td>
        <td>Mar 4</td>
        <td>$980.00</td>
      </tr>
    </tbody>
  </table>
)

/** Wide enough to make the horizontal overflow real, visible scrollbar or not. */
const scheduleTable = (
  <table>
    <caption>Backup schedule</caption>
    <thead>
      <tr>
        <th scope="col">Region</th>
        <th scope="col">Window</th>
        <th scope="col">Type</th>
        <th scope="col">Retention</th>
        <th scope="col">Owner</th>
        <th scope="col">Last verified</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>us-east</td>
        <td>02:00–03:00</td>
        <td>Full</td>
        <td>35 days</td>
        <td>Platform</td>
        <td>Yesterday</td>
      </tr>
      <tr>
        <td>eu-west</td>
        <td>02:00–03:00</td>
        <td>Incremental</td>
        <td>14 days</td>
        <td>Platform</td>
        <td>Yesterday</td>
      </tr>
    </tbody>
  </table>
)

/** The default: stroked container, comfortable cells, named scroll region. */
export const Default: Story = {
  args: { label: "Recent invoices" },
  render: (args) => <Table {...args}>{invoiceTable}</Table>,
}

/**
 * `plain` drops the container chrome and `compact` spends less cell padding:
 * two orthogonal knobs, shown together because they usually ship together.
 */
export const PlainCompact: Story = {
  args: { variant: "plain", density: "compact", label: "Recent invoices" },
  render: (args) => (
    <div
      style={{
        maxWidth: "36rem",
        border: "var(--sk-border-thick, 3px) solid var(--sk-color-shadow, #17141C)",
        padding: "1rem",
      }}
    >
      <Table {...args}>{invoiceTable}</Table>
    </div>
  ),
}

/** Zebra rows, with real content dense enough to show the banding. */
export const Striped: Story = {
  args: { striped: true, label: "Backup schedule" },
  render: (args) => (
    <div style={{ maxWidth: "36rem" }}>
      <Table {...args}>{scheduleTable}</Table>
    </div>
  ),
}

/**
 * Interaction test (plan.md §10): the scroll region is keyboard-focusable
 * because a scrollable region a keyboard cannot reach is unreachable content
 * (WCAG 2.1.1). The `role="group"` + name pair is the other claim the paint
 * cannot show statically — and it appears only when `label` is supplied.
 */
export const ScrollRegionIsKeyboardReachable: Story = {
  args: { label: "Backup schedule" },
  render: Striped.render,
  play: async ({ canvasElement, userEvent }) => {
    const canvas = within(canvasElement)
    const region = canvas.getByRole("group", { name: "Backup schedule" })
    await userEvent.tab()
    await expect(region).toHaveFocus()
  },
}
