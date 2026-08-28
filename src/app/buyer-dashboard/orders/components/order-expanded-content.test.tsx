import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { makeBuyerOrder, makeBuyerOrderItem, makeBuyerOrderSellerGroup } from "@/test/factories/order.factory"
import { buildBuyerOrderViewModel } from "../lib/order-view-utils"
import OrderExpandedContent from "./order-expanded-content"

const tableActions = {
  requestCancelAction: vi.fn(),
  requestRefundAction: vi.fn(),
  openLinksModal: vi.fn(),
  reorderItem: vi.fn(),
}

vi.mock("../context/buyer-orders-context", () => ({
  useBuyerOrdersTableSelector: (selector: (state: Record<string, unknown>) => unknown) =>
    selector({ cancelingItemId: null, cancelingSellerKey: null, reorderingItemId: null }),
  useBuyerOrdersTableActions: () => tableActions,
}))

vi.mock("./fulfillment-timeline", () => ({
  default: () => <div data-testid="timeline" />,
}))

const renderExpanded = (group: ReturnType<typeof makeBuyerOrderSellerGroup>) => {
  const order = makeBuyerOrder({ sellerGroups: [group] })
  return render(<OrderExpandedContent order={order} summary={buildBuyerOrderViewModel(order)} />)
}

describe("OrderExpandedContent — cancellation shipping money", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  // The backend computes both figures for real (OrderMapper.calculateOrderCancellationShipmentFee /
  // ...RefundFee) and has always sent them; the UI simply never rendered them, so a buyer whose
  // cancellation cost them shipping only found out from their card statement.
  it("shows the shipping charged when a cancellation kept the shipping fee", () => {
    renderExpanded(makeBuyerOrderSellerGroup({ cancellationShipmentFee: 12.5 }))

    expect(screen.getByText(/Shipping charged on cancellation/i)).toBeInTheDocument()
    expect(screen.getByText("$12.50")).toBeInTheDocument()
  })

  it("shows the shipping refunded back to the buyer", () => {
    renderExpanded(makeBuyerOrderSellerGroup({ cancellationShipmentRefundFee: 8 }))

    expect(screen.getByText(/Shipping refunded/i)).toBeInTheDocument()
    expect(screen.getByText("$8.00")).toBeInTheDocument()
  })

  it("shows a zero charge as $0.00 rather than hiding it", () => {
    renderExpanded(makeBuyerOrderSellerGroup({ cancellationShipmentFee: 0 }))

    expect(screen.getByText(/Shipping charged on cancellation/i)).toBeInTheDocument()
    expect(screen.getByText("$0.00")).toBeInTheDocument()
  })

  // null is the backend's "no cancellation has happened on this group" signal, not a zero amount.
  it.each([
    ["null", null],
    ["undefined", undefined],
  ])("renders no cancellation money row when both figures are %s", (_label, value) => {
    renderExpanded(
      makeBuyerOrderSellerGroup({
        cancellationShipmentFee: value,
        cancellationShipmentRefundFee: value,
        orderItems: [makeBuyerOrderItem()],
      }),
    )

    expect(screen.queryByText(/Shipping charged on cancellation/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Shipping refunded/i)).not.toBeInTheDocument()
  })
})
