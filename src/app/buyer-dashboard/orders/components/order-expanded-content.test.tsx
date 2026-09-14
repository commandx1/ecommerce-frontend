import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { HttpResponse, http } from "msw"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { server } from "@/mocks/server"
import { useAuthStore } from "@/stores/authStore"
import { makeAccountUser } from "@/test/factories"
import { makeBuyerOrder, makeBuyerOrderItem, makeBuyerOrderSellerGroup } from "@/test/factories/order.factory"
import { buildBuyerOrderViewModel } from "../lib/order-view-utils"
import OrderExpandedContent from "./order-expanded-content"

const mockToastError = vi.fn()
const mockToastSuccess = vi.fn()
vi.mock("@/components/ui/Toast", () => ({
  showToast: {
    error: (...args: unknown[]) => mockToastError(...args),
    success: (...args: unknown[]) => mockToastSuccess(...args),
    warning: vi.fn(),
    info: vi.fn(),
  },
}))

const signIn = () => useAuthStore.getState().setAuth(makeAccountUser(), "token-1", "refresh-1")

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

describe("OrderExpandedContent — heavy shipment fee refund on cancellation", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it("shows the heavy fee refunded when it is greater than 0", () => {
    renderExpanded(makeBuyerOrderSellerGroup({ cancellationHeavyShipmentFeeRefund: 50 }))

    expect(screen.getByText(/Heavy fee refunded/i)).toBeInTheDocument()
    expect(screen.getByText("$50.00")).toBeInTheDocument()
  })

  it.each([
    ["0", 0],
    ["null", null],
  ])("hides the heavy fee refunded row when the value is %s", (_label, value) => {
    renderExpanded(
      makeBuyerOrderSellerGroup({
        cancellationHeavyShipmentFeeRefund: value,
        orderItems: [makeBuyerOrderItem()],
      }),
    )

    expect(screen.queryByText(/Heavy fee refunded/i)).not.toBeInTheDocument()
  })
})

describe("OrderExpandedContent — item shipment/heavy fee display and summary panel", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it("shows the charged shipment amount without multiplying by quantity", () => {
    renderExpanded(
      makeBuyerOrderSellerGroup({
        orderItems: [makeBuyerOrderItem({ shipmentPrice: 12.99, quantity: 2 })],
      }),
    )

    expect(screen.getByText(/Shipment: \$12\.99/)).toBeInTheDocument()
  })

  it("shows Free Shipping when shipmentPrice is 0, even if shipmentFreeBySeller is not set", () => {
    renderExpanded(makeBuyerOrderSellerGroup({ orderItems: [makeBuyerOrderItem({ shipmentPrice: 0 })] }))

    expect(screen.getByText("Free Shipping")).toBeInTheDocument()
  })

  it("shows the charged shipment amount even when shipmentFreeBySeller is true (Uber orders can have both)", () => {
    renderExpanded(
      makeBuyerOrderSellerGroup({
        orderItems: [makeBuyerOrderItem({ shipmentPrice: 12.99, shipmentFreeBySeller: true })],
      }),
    )

    expect(screen.getByText(/Shipment: \$12\.99/)).toBeInTheDocument()
    expect(screen.queryByText("Free Shipping")).not.toBeInTheDocument()
  })

  it("shows the heavy fee on the item row when greater than 0, and hides it when 0/null", () => {
    renderExpanded(
      makeBuyerOrderSellerGroup({
        orderItems: [makeBuyerOrderItem({ takedHeavyShipmentFee: 50 })],
      }),
    )
    expect(screen.getByText(/Heavy fee: \$50\.00/)).toBeInTheDocument()
  })

  it("hides the heavy fee item row when takedHeavyShipmentFee is 0 or null", () => {
    renderExpanded(makeBuyerOrderSellerGroup({ orderItems: [makeBuyerOrderItem({ takedHeavyShipmentFee: null })] }))

    expect(screen.queryByText(/Heavy fee:/)).not.toBeInTheDocument()
  })

  it("shows the Heavy shipment fee and Tax rows in the summary panel when present, and computes the QA-verified total", () => {
    renderExpanded(
      makeBuyerOrderSellerGroup({
        orderItems: [
          makeBuyerOrderItem({
            price: 55.3,
            quantity: 2,
            shipmentPrice: 12.99,
            takedHeavyShipmentFee: 50,
            taxPrice: 0,
          }),
        ],
      }),
    )

    expect(screen.getByText("Heavy shipment fee")).toBeInTheDocument()
    expect(screen.queryByText("Tax")).not.toBeInTheDocument()
    expect(screen.getByText("$173.59")).toBeInTheDocument()
  })
})

describe("OrderExpandedContent — write a review", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    mockToastError.mockClear()
    mockToastSuccess.mockClear()
  })

  it('shows "Write a Review" for a DELIVERED item', () => {
    renderExpanded(makeBuyerOrderSellerGroup({ orderItems: [makeBuyerOrderItem({ status: "DELIVERED" })] }))

    expect(screen.getByRole("button", { name: /Write a Review/i })).toBeInTheDocument()
  })

  it.each(["ON_WAY", "RETURNED", "REFUNDED", "CANCELLED", "PROCESSING"])("hides the button for status %s", (status) => {
    renderExpanded(makeBuyerOrderSellerGroup({ orderItems: [makeBuyerOrderItem({ status })] }))

    expect(screen.queryByRole("button", { name: /Write a Review/i })).not.toBeInTheDocument()
  })

  it("treats lowercase and padded status as delivered", () => {
    renderExpanded(makeBuyerOrderSellerGroup({ orderItems: [makeBuyerOrderItem({ status: " delivered " })] }))

    expect(screen.getByRole("button", { name: /Write a Review/i })).toBeInTheDocument()
  })

  it.each([
    ["undefined", undefined],
    ["empty string", ""],
  ])("hides the button when status is %s", (_label, status) => {
    renderExpanded(
      makeBuyerOrderSellerGroup({
        orderItems: [makeBuyerOrderItem({ status: status as unknown as string })],
      }),
    )

    expect(screen.queryByRole("button", { name: /Write a Review/i })).not.toBeInTheDocument()
  })

  it("hides the button when the seller cancelled the item", () => {
    renderExpanded(
      makeBuyerOrderSellerGroup({
        orderItems: [makeBuyerOrderItem({ status: "DELIVERED", cancelledBySeller: true })],
      }),
    )

    expect(screen.queryByRole("button", { name: /Write a Review/i })).not.toBeInTheDocument()
  })

  it("hides the button when the customer cancelled the item", () => {
    renderExpanded(
      makeBuyerOrderSellerGroup({
        orderItems: [makeBuyerOrderItem({ status: "DELIVERED", cancelledByCustomer: true })],
      }),
    )

    expect(screen.queryByRole("button", { name: /Write a Review/i })).not.toBeInTheDocument()
  })

  it("hides the button when no productId can be resolved from the item", () => {
    renderExpanded(
      makeBuyerOrderSellerGroup({
        orderItems: [makeBuyerOrderItem({ status: "DELIVERED", productId: undefined })],
      }),
    )

    expect(screen.queryByRole("button", { name: /Write a Review/i })).not.toBeInTheDocument()
  })

  it("shows a disabled Reviewed button when the backend already marked the item reviewed", () => {
    renderExpanded(
      makeBuyerOrderSellerGroup({
        orderItems: [makeBuyerOrderItem({ status: "DELIVERED", reviewed: true })],
      }),
    )

    expect(screen.getByRole("button", { name: "Reviewed" })).toBeDisabled()
    expect(screen.queryByRole("button", { name: "Write a Review" })).not.toBeInTheDocument()
  })

  it.each([
    ["null", null],
    ["absent", undefined],
  ])("keeps the button enabled when reviewed is %s", (_label, reviewed) => {
    renderExpanded(
      makeBuyerOrderSellerGroup({
        orderItems: [makeBuyerOrderItem({ status: "DELIVERED", reviewed })],
      }),
    )

    expect(screen.getByRole("button", { name: "Write a Review" })).not.toBeDisabled()
  })

  it("opens the modal with the product name and seller full name", async () => {
    const user = userEvent.setup()
    signIn()
    renderExpanded(
      makeBuyerOrderSellerGroup({
        sellerName: "Acme",
        sellerSurname: "Store",
        orderItems: [makeBuyerOrderItem({ status: "DELIVERED", productName: "Dental Kit" })],
      }),
    )

    await user.click(screen.getByRole("button", { name: /Write a Review/i }))

    const dialog = within(await screen.findByRole("dialog"))
    expect(dialog.getByText("Dental Kit")).toBeInTheDocument()
    expect(dialog.getByText("Acme Store")).toBeInTheDocument()
  })

  it("posts the review for the delivered item and marks it as reviewed", async () => {
    const user = userEvent.setup()
    signIn()
    let body: unknown = null
    server.use(
      http.post("*/api/reviews", async ({ request }) => {
        body = await request.json()
        return new HttpResponse(null, { status: 200 })
      }),
    )
    renderExpanded(
      makeBuyerOrderSellerGroup({
        orderItems: [
          makeBuyerOrderItem({
            id: "item-9",
            productId: "p-9",
            userProductId: "up-9",
            status: "DELIVERED",
            productName: "Dental Kit",
          }),
        ],
      }),
    )

    await user.click(screen.getByRole("button", { name: /Write a Review/i }))
    const dialog = within(await screen.findByRole("dialog"))
    await user.click(dialog.getAllByRole("button")[5])
    await user.type(dialog.getByLabelText("Review Title *"), "Great")
    await user.type(dialog.getByLabelText("Your Review *"), "Works well")
    await user.click(dialog.getByRole("button", { name: /Submit Review/i }))

    await waitFor(() => expect(body).not.toBeNull())
    expect(body).toMatchObject({
      productId: "p-9",
      userProductId: "up-9",
      star: 5,
      title: "Great",
      comment: "Works well",
    })

    expect(await screen.findByRole("button", { name: "Reviewed" })).toBeDisabled()
  })

  it("reports a 400 with the backend message and keeps the button enabled", async () => {
    const user = userEvent.setup()
    signIn()
    server.use(
      http.post("*/api/reviews", () =>
        HttpResponse.json({ message: "You have already reviewed this seller's listing" }, { status: 400 }),
      ),
    )
    renderExpanded(makeBuyerOrderSellerGroup({ orderItems: [makeBuyerOrderItem({ status: "DELIVERED" })] }))

    await user.click(screen.getByRole("button", { name: /Write a Review/i }))
    const dialog = within(await screen.findByRole("dialog"))
    await user.click(dialog.getAllByRole("button")[3])
    await user.type(dialog.getByLabelText("Review Title *"), "Great")
    await user.type(dialog.getByLabelText("Your Review *"), "Works well")
    await user.click(dialog.getByRole("button", { name: /Submit Review/i }))

    await waitFor(() => expect(mockToastError).toHaveBeenCalledWith("You have already reviewed this seller's listing"))
    // The failed submit keeps the modal open (same behavior as WriteReviewModal's other callers);
    // closing it manually confirms the item was never marked as reviewed.
    await user.click(dialog.getByRole("button", { name: /Cancel/i }))
    expect(screen.getByRole("button", { name: "Write a Review" })).not.toBeDisabled()
  })
})
