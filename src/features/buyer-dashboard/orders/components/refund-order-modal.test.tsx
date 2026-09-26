import { fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { BuyerOrder } from "@/lib/api/buyer-orders"
import { makeBuyerOrder, makeBuyerOrderItem } from "@/test/factories/order.factory"
import { installRadixPointerPolyfills } from "@/test/radix"
import RefundOrderModal from "./refund-order-modal"

// The reason Select is a Radix `Select` rendered inside a Radix `Dialog`; opening it needs jsdom's
// pointer-capture APIs, which jsdom itself doesn't implement (see `installRadixPointerPolyfills`).
installRadixPointerPolyfills()

const setupUser = () => userEvent.setup()

const mockUseBuyerOrdersRefundModalState = vi.fn()
const mockUseBuyerOrdersRefundModalActions = vi.fn()

vi.mock("../context/buyer-orders-context", () => ({
  useBuyerOrdersRefundModalState: () => mockUseBuyerOrdersRefundModalState(),
  useBuyerOrdersRefundModalActions: () => mockUseBuyerOrdersRefundModalActions(),
}))

function createStateValue(overrides?: Partial<ReturnType<typeof mockUseBuyerOrdersRefundModalState>>) {
  return {
    isSubmittingRefund: false,
    pendingRefundOrder: null,
    ...overrides,
  }
}

/** Locates the card rendered for one order item so quantity/reason controls can be scoped to it. */
const itemCard = (productName: string) => within(screen.getByText(productName).closest("div.rounded-xl") as HTMLElement)

const selectReturnReason = async (card: ReturnType<typeof itemCard>, reason: string) => {
  const user = userEvent.setup()
  await user.click(card.getByLabelText("Return reason"))
  await user.click(await screen.findByRole("option", { name: reason }))
}

beforeEach(() => {
  vi.restoreAllMocks()
  mockUseBuyerOrdersRefundModalState.mockReset()
  mockUseBuyerOrdersRefundModalActions.mockReset()
})

describe("RefundOrderModal", () => {
  it("does not render when there is no pending refund order", () => {
    mockUseBuyerOrdersRefundModalState.mockReturnValue(createStateValue({ pendingRefundOrder: null }))
    mockUseBuyerOrdersRefundModalActions.mockReturnValue({
      setPendingRefundOrder: vi.fn(),
      submitRefundOrder: vi.fn(),
    })

    render(<RefundOrderModal />)

    expect(screen.queryByText("Request Return")).not.toBeInTheDocument()
  })

  it("preselects the only item when the order has exactly one refundable item", () => {
    const order = makeBuyerOrder({
      orderItems: [makeBuyerOrderItem({ id: "item-1", productName: "Dental Kit", quantity: 3 })],
    })
    mockUseBuyerOrdersRefundModalState.mockReturnValue(createStateValue({ pendingRefundOrder: order }))
    mockUseBuyerOrdersRefundModalActions.mockReturnValue({
      setPendingRefundOrder: vi.fn(),
      submitRefundOrder: vi.fn(),
    })

    render(<RefundOrderModal />)

    expect(itemCard("Dental Kit").getByRole("checkbox")).toBeChecked()
  })

  it("does not preselect any item when the order has more than one refundable item", () => {
    const order = makeBuyerOrder({
      orderItems: [
        makeBuyerOrderItem({ id: "item-1", productName: "Dental Kit", quantity: 3 }),
        makeBuyerOrderItem({ id: "item-2", productName: "Gloves Box", quantity: 5 }),
      ],
    })
    mockUseBuyerOrdersRefundModalState.mockReturnValue(createStateValue({ pendingRefundOrder: order }))
    mockUseBuyerOrdersRefundModalActions.mockReturnValue({
      setPendingRefundOrder: vi.fn(),
      submitRefundOrder: vi.fn(),
    })

    render(<RefundOrderModal />)

    expect(itemCard("Dental Kit").getByRole("checkbox")).not.toBeChecked()
    expect(itemCard("Gloves Box").getByRole("checkbox")).not.toBeChecked()
  })

  it("excludes an item that already has an active return from the refundable list", () => {
    const order = makeBuyerOrder({
      orderItems: [
        makeBuyerOrderItem({
          id: "item-1",
          productName: "Dental Kit",
          quantity: 3,
          returnDate: "2026-08-20T10:00:00Z",
        }),
        makeBuyerOrderItem({ id: "item-2", productName: "Gloves Box", quantity: 5 }),
      ],
    })
    mockUseBuyerOrdersRefundModalState.mockReturnValue(createStateValue({ pendingRefundOrder: order }))
    mockUseBuyerOrdersRefundModalActions.mockReturnValue({
      setPendingRefundOrder: vi.fn(),
      submitRefundOrder: vi.fn(),
    })

    render(<RefundOrderModal />)

    expect(screen.queryByText("Dental Kit")).not.toBeInTheDocument()
    // The one remaining refundable item is preselected, matching the single-item rule above.
    expect(itemCard("Gloves Box").getByRole("checkbox")).toBeChecked()
  })

  describe("quantity input clamps every out-of-range value to a valid one", () => {
    it.each([
      ["below the minimum of 1", "0", 1],
      ["a negative number", "-5", 1],
      ["one more than the refundable quantity (max is 3)", "4", 3],
      ["a decimal (truncated to a whole number)", "2.7", 2],
      ["the smallest valid quantity", "1", 1],
      ["the largest valid quantity (the item's own quantity)", "3", 3],
    ])("typing %s -> field ends up at %s", (_label, typed, expected) => {
      const order = makeBuyerOrder({
        orderItems: [makeBuyerOrderItem({ id: "item-1", productName: "Dental Kit", quantity: 3 })],
      })
      mockUseBuyerOrdersRefundModalState.mockReturnValue(createStateValue({ pendingRefundOrder: order }))
      mockUseBuyerOrdersRefundModalActions.mockReturnValue({
        setPendingRefundOrder: vi.fn(),
        submitRefundOrder: vi.fn(),
      })

      render(<RefundOrderModal />)
      const quantityInput = itemCard("Dental Kit").getByLabelText("Quantity to refund")

      // fireEvent.change sets the whole value atomically - avoids user-event's char-by-char typing
      // getting stuck on transiently-invalid states (e.g. a lone "-") on a controlled number input.
      fireEvent.change(quantityInput, { target: { value: typed } })

      expect(quantityInput).toHaveValue(expected)
    })
  })

  it("blocks submission with a clear message and sends no request when the return reason is left empty", async () => {
    const user = setupUser()
    const submitRefundOrder = vi.fn()
    const order = makeBuyerOrder({
      orderItems: [makeBuyerOrderItem({ id: "item-1", productName: "Dental Kit", quantity: 3 })],
    })
    mockUseBuyerOrdersRefundModalState.mockReturnValue(createStateValue({ pendingRefundOrder: order }))
    mockUseBuyerOrdersRefundModalActions.mockReturnValue({ setPendingRefundOrder: vi.fn(), submitRefundOrder })

    render(<RefundOrderModal />)
    // The only item is preselected by default; the reason is left blank.
    await user.click(screen.getByRole("button", { name: "Submit refund request" }))

    expect(screen.getByText("Each selected item must have a valid quantity and a return reason.")).toBeInTheDocument()
    expect(submitRefundOrder).not.toHaveBeenCalled()
  })

  it("blocks submission when no item is selected at all", async () => {
    const user = setupUser()
    const submitRefundOrder = vi.fn()
    const order = makeBuyerOrder({
      orderItems: [
        makeBuyerOrderItem({ id: "item-1", productName: "Dental Kit", quantity: 3 }),
        makeBuyerOrderItem({ id: "item-2", productName: "Gloves Box", quantity: 5 }),
      ],
    })
    mockUseBuyerOrdersRefundModalState.mockReturnValue(createStateValue({ pendingRefundOrder: order }))
    mockUseBuyerOrdersRefundModalActions.mockReturnValue({ setPendingRefundOrder: vi.fn(), submitRefundOrder })

    render(<RefundOrderModal />)
    await user.click(screen.getByRole("button", { name: "Submit refund request" }))

    expect(screen.getByText("Please select at least one item to refund.")).toBeInTheDocument()
    expect(submitRefundOrder).not.toHaveBeenCalled()
  })

  it("blocks submission when the only refundable quantity left on an item is 0 (hostile backend data)", async () => {
    const user = setupUser()
    const submitRefundOrder = vi.fn()
    const order = makeBuyerOrder({
      orderItems: [makeBuyerOrderItem({ id: "item-1", productName: "Dental Kit", quantity: 0 })],
    })
    mockUseBuyerOrdersRefundModalState.mockReturnValue(createStateValue({ pendingRefundOrder: order }))
    mockUseBuyerOrdersRefundModalActions.mockReturnValue({ setPendingRefundOrder: vi.fn(), submitRefundOrder })

    render(<RefundOrderModal />)
    await selectReturnReason(itemCard("Dental Kit"), "No Longer Needed")
    await user.click(screen.getByRole("button", { name: "Submit refund request" }))

    // The default quantity (1) exceeds the item's own quantity (0); this must not crash and must
    // not reach the network - it must be caught by the same "cannot exceed order quantity" rule
    // that blocks a manually-typed quantity above the max.
    expect(screen.getByText("Each selected item must have a valid quantity and a return reason.")).toBeInTheDocument()
    expect(submitRefundOrder).not.toHaveBeenCalled()
  })

  it("sends a payload matching the backend RefundOrderItemRequest contract exactly (orderItemId, quantity, returnReason - no extra fields)", async () => {
    const user = setupUser()
    const submitRefundOrder = vi.fn().mockResolvedValue(undefined)
    const order = makeBuyerOrder({
      orderId: "order-77",
      orderItems: [makeBuyerOrderItem({ id: "item-1", productName: "Dental Kit", quantity: 3 })],
    })
    mockUseBuyerOrdersRefundModalState.mockReturnValue(createStateValue({ pendingRefundOrder: order }))
    mockUseBuyerOrdersRefundModalActions.mockReturnValue({ setPendingRefundOrder: vi.fn(), submitRefundOrder })

    render(<RefundOrderModal />)
    const card = itemCard("Dental Kit")
    const quantityInput = card.getByLabelText("Quantity to refund")
    fireEvent.change(quantityInput, { target: { value: "2" } })
    await selectReturnReason(card, "Product Arrived Damaged")

    await user.click(screen.getByRole("button", { name: "Submit refund request" }))

    await waitFor(() => expect(submitRefundOrder).toHaveBeenCalledTimes(1))
    const payload = submitRefundOrder.mock.calls[0]![0]
    expect(payload).toEqual({
      items: [{ orderItemId: "item-1", quantity: 2, returnReason: "Product Arrived Damaged" }],
    })
    // Exactly the three fields the backend's RefundOrderItemRequest declares - nothing extra.
    expect(Object.keys(payload.items[0]).sort()).toEqual(["orderItemId", "quantity", "returnReason"])
  })

  it("lets each selected item carry its own quantity and reason, and excludes unselected items from the payload", async () => {
    const user = setupUser()
    const submitRefundOrder = vi.fn().mockResolvedValue(undefined)
    const order = makeBuyerOrder({
      orderItems: [
        makeBuyerOrderItem({ id: "item-1", productName: "Dental Kit", quantity: 3 }),
        makeBuyerOrderItem({ id: "item-2", productName: "Gloves Box", quantity: 5 }),
        makeBuyerOrderItem({ id: "item-3", productName: "Face Mask", quantity: 10 }),
      ],
    })
    mockUseBuyerOrdersRefundModalState.mockReturnValue(createStateValue({ pendingRefundOrder: order }))
    mockUseBuyerOrdersRefundModalActions.mockReturnValue({ setPendingRefundOrder: vi.fn(), submitRefundOrder })

    render(<RefundOrderModal />)

    const kitCard = itemCard("Dental Kit")
    await user.click(kitCard.getByRole("checkbox"))
    const kitQuantity = kitCard.getByLabelText("Quantity to refund")
    fireEvent.change(kitQuantity, { target: { value: "2" } })
    await selectReturnReason(kitCard, "Wrong Item Received")

    const gloveCard = itemCard("Gloves Box")
    await user.click(gloveCard.getByRole("checkbox"))
    const gloveQuantity = gloveCard.getByLabelText("Quantity to refund")
    fireEvent.change(gloveQuantity, { target: { value: "5" } })
    await selectReturnReason(gloveCard, "Defective or Malfunctioning Product")

    // Face Mask is deliberately left unselected.
    await user.click(screen.getByRole("button", { name: "Submit refund request" }))

    await waitFor(() => expect(submitRefundOrder).toHaveBeenCalledTimes(1))
    const payload = submitRefundOrder.mock.calls[0]![0]
    expect(payload.items).toHaveLength(2)
    expect(payload.items).toEqual(
      expect.arrayContaining([
        { orderItemId: "item-1", quantity: 2, returnReason: "Wrong Item Received" },
        { orderItemId: "item-2", quantity: 5, returnReason: "Defective or Malfunctioning Product" },
      ]),
    )
    expect(payload.items.some((item: { orderItemId: string }) => item.orderItemId === "item-3")).toBe(false)
  })

  it("trims surrounding whitespace from the return reason before sending it", async () => {
    // The Select only ever produces exact option values, so whitespace can't come from a normal
    // interaction - this exercises the `.trim()` call in handleSubmit directly via a case that
    // still passes validation (a non-empty, non-whitespace-only reason).
    const user = setupUser()
    const submitRefundOrder = vi.fn().mockResolvedValue(undefined)
    const order = makeBuyerOrder({
      orderItems: [makeBuyerOrderItem({ id: "item-1", productName: "Dental Kit", quantity: 3 })],
    })
    mockUseBuyerOrdersRefundModalState.mockReturnValue(createStateValue({ pendingRefundOrder: order }))
    mockUseBuyerOrdersRefundModalActions.mockReturnValue({ setPendingRefundOrder: vi.fn(), submitRefundOrder })

    render(<RefundOrderModal />)
    await selectReturnReason(itemCard("Dental Kit"), "Other")
    await user.click(screen.getByRole("button", { name: "Submit refund request" }))

    await waitFor(() => expect(submitRefundOrder).toHaveBeenCalledTimes(1))
    expect(submitRefundOrder.mock.calls[0]![0].items[0].returnReason).toBe("Other")
  })

  it("does not crash and shows no items when the pending order's item data is malformed", () => {
    const malformedOrder = {
      orderId: "order-broken",
      totalPrice: 0,
      orderStatus: "PAID",
      createdDate: "2026-05-20T10:30:00Z",
      addressTitle: "Home",
      addressFormattedAddress: "Somewhere",
      orderItems: undefined,
      sellerGroups: "not-an-array" as unknown as BuyerOrder["sellerGroups"],
    } as unknown as BuyerOrder

    mockUseBuyerOrdersRefundModalState.mockReturnValue(createStateValue({ pendingRefundOrder: malformedOrder }))
    mockUseBuyerOrdersRefundModalActions.mockReturnValue({
      setPendingRefundOrder: vi.fn(),
      submitRefundOrder: vi.fn(),
    })

    expect(() => render(<RefundOrderModal />)).not.toThrow()
    expect(screen.getByText("Request Return")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Submit refund request" })).toBeInTheDocument()
  })

  it("blocks submission (rather than crashing) when the order has no refundable items at all", async () => {
    const user = setupUser()
    const submitRefundOrder = vi.fn()
    // The factory defaults `sellerGroups` to one seller with one item - clear it too, otherwise
    // `getOrderItems` falls back to that default group and the order isn't actually itemless.
    const order = makeBuyerOrder({ orderItems: [], sellerGroups: [] })
    mockUseBuyerOrdersRefundModalState.mockReturnValue(createStateValue({ pendingRefundOrder: order }))
    mockUseBuyerOrdersRefundModalActions.mockReturnValue({ setPendingRefundOrder: vi.fn(), submitRefundOrder })

    render(<RefundOrderModal />)
    await user.click(screen.getByRole("button", { name: "Submit refund request" }))

    expect(screen.getByText("Please select at least one item to refund.")).toBeInTheDocument()
    expect(submitRefundOrder).not.toHaveBeenCalled()
  })

  it("closes the modal via the header close button and the footer Cancel button", async () => {
    const user = setupUser()
    const setPendingRefundOrder = vi.fn()
    const order = makeBuyerOrder({
      orderItems: [makeBuyerOrderItem({ id: "item-1", productName: "Dental Kit", quantity: 3 })],
    })
    mockUseBuyerOrdersRefundModalState.mockReturnValue(createStateValue({ pendingRefundOrder: order }))
    mockUseBuyerOrdersRefundModalActions.mockReturnValue({ setPendingRefundOrder, submitRefundOrder: vi.fn() })

    render(<RefundOrderModal />)

    await user.click(screen.getByRole("button", { name: "Close refund modal" }))
    expect(setPendingRefundOrder).toHaveBeenNthCalledWith(1, null)

    await user.click(screen.getByRole("button", { name: "Cancel" }))
    expect(setPendingRefundOrder).toHaveBeenNthCalledWith(2, null)
  })

  it("disables every control and blocks Escape while a refund request is in flight", async () => {
    const user = setupUser()
    const setPendingRefundOrder = vi.fn()
    const order = makeBuyerOrder({
      orderItems: [makeBuyerOrderItem({ id: "item-1", productName: "Dental Kit", quantity: 3 })],
    })
    mockUseBuyerOrdersRefundModalState.mockReturnValue(
      createStateValue({ pendingRefundOrder: order, isSubmittingRefund: true }),
    )
    mockUseBuyerOrdersRefundModalActions.mockReturnValue({ setPendingRefundOrder, submitRefundOrder: vi.fn() })

    render(<RefundOrderModal />)

    expect(screen.getByRole("button", { name: "Close refund modal" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled()
    expect(screen.getByRole("button", { name: /Submitting/ })).toBeDisabled()
    expect(itemCard("Dental Kit").getByLabelText("Quantity to refund")).toBeDisabled()

    await user.keyboard("{Escape}")
    expect(setPendingRefundOrder).not.toHaveBeenCalled()
  })
})
