import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, waitFor } from "storybook/test"
import { Pagination, type SkPaginationElement } from "@santaka-ui/react"

/**
 * Stories for the Pagination adapter.
 *
 * The window — which numbers appear and where the ellipses go — is computed by the
 * element, not here. That is the part every consumer reimplements badly.
 */
const meta = {
  title: "Components/Pagination",
  component: Pagination,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  argTypes: {
    count: { control: { type: "number", min: 1, max: 40 } },
    page: { control: { type: "number", min: 1, max: 40 } },
    siblings: { control: { type: "number", min: 0, max: 3 } },
  },
  args: {
    count: 12,
    page: 6,
  },
} satisfies Meta<typeof Pagination>

export default meta
type Story = StoryObj<typeof meta>

/** Mid-range: first, last, and a window around the current page. */
export const MidRange: Story = {}

/** On the first page: Prev is unavailable. */
export const FirstPage: Story = {
  args: { count: 12, page: 1 },
}

/** On the last page: Next is unavailable. */
export const LastPage: Story = {
  args: { count: 12, page: 12 },
}

/** A short range — no ellipses at all, which is correct rather than broken. */
export const FewPages: Story = {
  args: { count: 4, page: 2 },
}

/** A wider window, for when the reader needs more context either side. */
export const WideWindow: Story = {
  args: { count: 30, page: 15, siblings: 2 },
}

/**
 * Picking a page moves the marker and fires the event.
 *
 * The browser suite (`packages/web-components/e2e/pagination.e2e.ts`) owns the
 * a11y contract: the landmark, links-versus-spans, the silent ellipsis, the
 * step names, and `aria-current` on a span rather than a dead link. This play
 * only covers what that suite does not — that the href-less component updates
 * its own `page` prop on click (the window moves with it) and that
 * `sk-page-change` carries the picked page in `detail`, which is what a React
 * consumer would wire `onChange` to.
 */
export const PickingAPage: Story = {
  play: async ({ canvasElement, userEvent }) => {
    const host = canvasElement.querySelector("sk-pagination") as SkPaginationElement

    // `[data-slot="page"]`, matching what the browser suite queries: the page
    // slot's visible glyph carries no accessible name of its own, so a
    // `getByRole("link", { name: "Page 7" })` does not resolve here.
    const pages = () => Array.from(canvasElement.querySelectorAll('[data-slot="page"]'))
    // The marker is read from the element carrying the contract rather than from
    // a text match: "6" also appears inside a step's visually hidden word, so a
    // text query can resolve to that instead.
    await waitFor(() => {
      const marked = canvasElement.querySelector('[data-slot="page"][aria-current="page"]')
      expect(marked).not.toBeNull()
      // The current page is a span, not a dead link that goes nowhere.
      expect(marked?.tagName).toBe("SPAN")
      expect(marked?.textContent).toContain("6")
    })

    let changed: number | undefined
    host.addEventListener("sk-page-change", (event: Event) => {
      changed = (event as CustomEvent<{ page: number }>).detail?.page
    })

    // With 12 pages and the marker on 6 the window is `1 … 5 6 7 … 12`, so 7 is
    // a page that is actually rendered — 8 is not in the window at all, and a
    // test that looks for it would be asserting a slot that never exists.
    const seven = pages().find(
      (page) => page.querySelector('[aria-hidden="true"]')?.textContent?.trim() === "7",
    )
    expect(seven, "no page slot renders the number 7").toBeDefined()
    await userEvent.click(seven as HTMLElement)
    // The click path is the one that proves the marker follows the value
    // rather than staying put, and that the event carries the new page.
    await waitFor(() => {
      expect(host.page).toBe(7)
      expect(changed).toBe(7)
    })
    await waitFor(() => {
      const marked = canvasElement.querySelector('[data-slot="page"][aria-current="page"]')
      expect(marked?.textContent).toContain("7")
      expect(marked?.tagName).toBe("SPAN")
    })
  },
}
