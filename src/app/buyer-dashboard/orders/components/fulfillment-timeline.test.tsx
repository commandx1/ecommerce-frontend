import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import FulfillmentTimeline from "./fulfillment-timeline"

// This component takes plain props (`item`, `orderDate`) - it does not read the buyer-orders
// context, so there is nothing to mock. It DOES call the real `order-view-utils` helpers
// (`resolveOrderItemFulfillmentState`, `formatDateOnly`) - those functions' own logic is covered by
// order-view-utils.test.ts; here we only verify FulfillmentTimeline USES their output correctly.

const ORDER_DATE = "May 20, 2026"

function baseItem(overrides: Partial<Parameters<typeof FulfillmentTimeline>[0]["item"]> = {}) {
  return {
    status: "WAITING_FOR_SHIPMENT",
    deliveredDate: null,
    refundStatus: null,
    returnRefundStatus: null,
    returnDate: null,
    returnReason: null,
    returnRejectReason: null,
    returnRejectDate: null,
    cancelledByCustomer: null,
    cancelledBySeller: null,
    cancelledWithShippingFee: null,
    updatedDate: null,
    ...overrides,
  }
}

// Both the desktop (`.hidden md:block`) and mobile-compact (`.md:hidden`) renderings of the
// timeline are mounted in the DOM at the same time - only CSS hides one of them (TEST-FINDINGS.md
// infra note #18). Scope queries to the desktop `Steps.Root` list so step-label assertions aren't
// ambiguous with the mobile compact button's `currentStep.label` text.
function desktopSteps(container: HTMLElement) {
  const desktop = container.querySelector(".hidden.md\\:block")
  if (!desktop) throw new Error("desktop timeline section not found")
  return within(desktop as HTMLElement)
}

describe("FulfillmentTimeline — step states per status", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it.each([
    ["WAITING_FOR_SHIPMENT (processing)", "WAITING_FOR_SHIPMENT", ["Placed", "Processing", "Shipping", "Delivered"]],
    ["ON_WAY (shipping active)", "ON_WAY", ["Placed", "Processing", "Shipping", "Delivered"]],
    ["SHIPPED (shipping done, delivered pending)", "SHIPPED", ["Placed", "Processing", "Shipping", "Delivered"]],
    ["DELIVERED (all done)", "DELIVERED", ["Placed", "Processing", "Shipping", "Delivered"]],
  ])("renders Placed/Processing/Shipping/Delivered steps for status=%s", (_label, status, expectedLabels) => {
    const { container } = render(<FulfillmentTimeline item={baseItem({ status })} orderDate={ORDER_DATE} />)

    const desktop = desktopSteps(container)
    for (const label of expectedLabels) {
      expect(desktop.getByText(label)).toBeInTheDocument()
    }
  })

  it("shows the formatted delivered date on the Delivered step once the item has one", () => {
    const { container } = render(
      <FulfillmentTimeline
        item={baseItem({ status: "DELIVERED", deliveredDate: "2026-05-22T10:00:00Z" })}
        orderDate={ORDER_DATE}
      />,
    )

    const desktop = desktopSteps(container)
    expect(desktop.getByText(/May 22, 2026/)).toBeInTheDocument()
  })

  it("always renders the Placed step with the given order date", () => {
    const { container } = render(<FulfillmentTimeline item={baseItem()} orderDate={ORDER_DATE} />)

    const desktop = desktopSteps(container)
    expect(desktop.getByText("Placed")).toBeInTheDocument()
    expect(desktop.getByText(ORDER_DATE)).toBeInTheDocument()
  })
})

describe("FulfillmentTimeline — cancellation flow", () => {
  it("stops the timeline at a 'Cancelled by Customer' step when cancelled before shipping", () => {
    const { container } = render(
      <FulfillmentTimeline
        item={baseItem({
          cancelledByCustomer: true,
          cancelledWithShippingFee: false,
          updatedDate: "2026-05-21T00:00:00Z",
        })}
        orderDate={ORDER_DATE}
      />,
    )

    const desktop = desktopSteps(container)
    expect(desktop.getByText("Cancelled by Customer")).toBeInTheDocument()
    expect(desktop.queryByText("Shipping")).not.toBeInTheDocument()
    expect(desktop.queryByText("Delivered")).not.toBeInTheDocument()
  })

  it("includes a done Shipping step before 'Cancelled by Seller' when cancelled during shipping", () => {
    const { container } = render(
      <FulfillmentTimeline
        item={baseItem({
          cancelledBySeller: true,
          cancelledWithShippingFee: true,
          updatedDate: "2026-05-21T00:00:00Z",
        })}
        orderDate={ORDER_DATE}
      />,
    )

    const desktop = desktopSteps(container)
    expect(desktop.getByText("Shipping")).toBeInTheDocument()
    expect(desktop.getByText("Cancelled by Seller")).toBeInTheDocument()
    expect(desktop.queryByText("Delivered")).not.toBeInTheDocument()
  })
})

describe("FulfillmentTimeline — return flow changes the timeline", () => {
  it("adds a Return step and marks Processing/Shipping/Delivered as done once a return has started", () => {
    const { container } = render(
      <FulfillmentTimeline
        item={baseItem({
          status: "WAITING_FOR_SHIPMENT",
          returnRefundStatus: "PENDING",
          returnDate: "2026-05-25T00:00:00Z",
        })}
        orderDate={ORDER_DATE}
      />,
    )

    const desktop = desktopSteps(container)
    expect(desktop.getByText("Return")).toBeInTheDocument()
    // The item's real fulfillment status was still WAITING_FOR_SHIPMENT (processing/pending), but a
    // return already exists on it - the timeline must show the return's progress, not stall at
    // "Processing", or a buyer mid-return sees a timeline that looks stuck.
    expect(desktop.getByText("Delivered")).toBeInTheDocument()
  })

  it("adds an Approved decision step for an approved return", () => {
    const { container } = render(
      <FulfillmentTimeline
        item={baseItem({ returnRefundStatus: "APPROVED", returnDate: "2026-05-25T00:00:00Z" })}
        orderDate={ORDER_DATE}
      />,
    )

    expect(desktopSteps(container).getByText("Approved")).toBeInTheDocument()
  })

  it("adds a Rejected decision step and a reject-reason tooltip for a rejected return", async () => {
    const user = userEvent.setup()
    const { container } = render(
      <FulfillmentTimeline
        item={baseItem({
          returnRefundStatus: "REJECTED_BY_SELLER",
          returnDate: "2026-05-25T00:00:00Z",
          returnRejectReason: "Item was used",
          returnRejectDate: "2026-05-26T00:00:00Z",
        })}
        orderDate={ORDER_DATE}
      />,
    )

    expect(desktopSteps(container).getByText("Rejected")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Show reject reason" }))
    expect(await screen.findByText("Item was used")).toBeInTheDocument()
  })

  it("shows the return reason in a tooltip when the buyer provided one", async () => {
    const user = userEvent.setup()
    render(
      <FulfillmentTimeline
        item={baseItem({
          returnRefundStatus: "PENDING",
          returnDate: "2026-05-25T00:00:00Z",
          returnReason: "Wrong size",
        })}
        orderDate={ORDER_DATE}
      />,
    )

    await user.click(screen.getByRole("button", { name: "Show return reason" }))
    expect(await screen.findByText("Wrong size")).toBeInTheDocument()
  })

  it("adds a Returned step once the item's own status is RETURNED", () => {
    const { container } = render(
      <FulfillmentTimeline
        item={baseItem({ status: "RETURNED", returnRefundStatus: "APPROVED", returnDate: "2026-05-25T00:00:00Z" })}
        orderDate={ORDER_DATE}
      />,
    )

    expect(desktopSteps(container).getByText("Returned")).toBeInTheDocument()
  })
})

describe("FulfillmentTimeline — mobile compact view + modal", () => {
  it("opens a modal with the vertical timeline when the mobile 'View' control is tapped", async () => {
    const user = userEvent.setup()
    render(<FulfillmentTimeline item={baseItem({ status: "SHIPPED" })} orderDate={ORDER_DATE} />)

    expect(screen.queryByRole("heading", { name: "Fulfillment Timeline" })).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: /View/i }))

    expect(await screen.findByRole("heading", { name: "Fulfillment Timeline" })).toBeInTheDocument()
  })
})

describe("FulfillmentTimeline — C axis: hostile data does not crash", () => {
  it.each([
    ["deliveredDate is a corrupt string", baseItem({ status: "DELIVERED", deliveredDate: "not-a-date" })],
    ["returnDate is a corrupt string", baseItem({ returnRefundStatus: "PENDING", returnDate: "not-a-date" })],
    [
      "returnRejectDate is a corrupt string",
      baseItem({ returnRefundStatus: "REJECTED_BY_SELLER", returnRejectDate: "not-a-date" }),
    ],
    ["updatedDate is a corrupt string", baseItem({ cancelledByCustomer: true, updatedDate: "not-a-date" })],
    ["status is an unrecognised backend enum value", baseItem({ status: "SOME_FUTURE_STATUS" })],
    [
      "returnReason is not a string",
      { ...baseItem({ returnRefundStatus: "PENDING" }), returnReason: 42 as unknown as string },
    ],
    ["refundStatus (legacy) is used when returnRefundStatus is absent", baseItem({ refundStatus: "pending" })],
  ])("does not crash when %s", (_label, item) => {
    expect(() => render(<FulfillmentTimeline item={item} orderDate={ORDER_DATE} />)).not.toThrow()
  })

  it.each([
    ["status is null", null],
    ["status is missing (undefined)", undefined],
  ])("does not crash when item.status is %s", (_label, status) => {
    const item = { ...baseItem(), status: status as unknown as string }
    expect(() => render(<FulfillmentTimeline item={item} orderDate={ORDER_DATE} />)).not.toThrow()
  })

  it("does not crash when orderDate itself is missing", () => {
    expect(() =>
      render(<FulfillmentTimeline item={baseItem()} orderDate={undefined as unknown as string} />),
    ).not.toThrow()
  })
})
