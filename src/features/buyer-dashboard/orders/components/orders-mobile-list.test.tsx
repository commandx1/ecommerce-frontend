import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { BuyerOrder } from "@/lib/api/buyer-orders"
import { makeBuyerOrder, makeBuyerOrderItem, makeBuyerOrderSellerGroup } from "@/test/factories/order.factory"
import { buildBuyerOrderViewModel } from "../lib/order-view-model"
import OrdersMobileList from "./orders-mobile-list"

const mockUseBuyerOrdersTableSelector = vi.fn()
const mockUseBuyerOrdersTableActions = vi.fn()

vi.mock("../context/buyer-orders-context", () => ({
  useBuyerOrdersTableSelector: (selector: (state: ReturnType<typeof mockUseBuyerOrdersTableSelector>) => unknown) =>
    selector(mockUseBuyerOrdersTableSelector()),
  useBuyerOrdersTableActions: () => mockUseBuyerOrdersTableActions(),
}))

// `Collapse`/`CollapseContent` always mount their children (hidden via CSS grid-rows/opacity, not
// unmounted — see TEST-FINDINGS.md infra note #18: desktop/mobile variants sit in the DOM together
// via CSS-only hiding, and this is the same "always mounted" shape). `OrderExpandedContent` is a
// large, separately-owned component (order-expanded-content.test.tsx covers it); stub it here so
// this file stays focused on OrdersMobileList's own rendering/interaction/guard behaviour.
vi.mock("./order-expanded-content", () => ({
  default: () => <div data-testid="expanded-content" />,
}))

function createTableState(overrides: Partial<ReturnType<typeof mockUseBuyerOrdersTableSelector>> = {}) {
  return {
    sortField: "createdDate" as const,
    sortDir: "desc" as const,
    expandedState: {},
    filteredOrders: [] as BuyerOrder[],
    isLoading: false,
    summariesByOrderId: new Map(),
    ...overrides,
  }
}

const defaultActions = () => ({
  handleSort: vi.fn(),
  handleExpandedChange: vi.fn(),
})

beforeEach(() => {
  vi.restoreAllMocks()
  mockUseBuyerOrdersTableSelector.mockReset()
  mockUseBuyerOrdersTableActions.mockReset()
  mockUseBuyerOrdersTableActions.mockReturnValue(defaultActions())
})

describe("OrdersMobileList — rendering", () => {
  it("renders a skeleton card list while loading, before any order data", () => {
    mockUseBuyerOrdersTableSelector.mockReturnValue(createTableState({ isLoading: true }))

    const { container } = render(<OrdersMobileList />)

    // 4 order card skeletons, one per placeholder row.
    expect(container.querySelectorAll('[data-testid="order-card-skeleton"]')).toHaveLength(4)
    expect(screen.queryByText("No orders found.")).not.toBeInTheDocument()
  })

  it("shows the empty state when there are no orders", () => {
    mockUseBuyerOrdersTableSelector.mockReturnValue(createTableState({ filteredOrders: [] }))

    render(<OrdersMobileList />)

    expect(screen.getByText("No orders found.")).toBeInTheDocument()
  })

  it("renders a card with date, status badge, seller, item count and net total", () => {
    const order = makeBuyerOrder({
      orderId: "order-42",
      orderStatus: "PAID",
      sellerGroups: [
        makeBuyerOrderSellerGroup({
          sellerName: "Acme",
          sellerSurname: "Dental",
          orderItems: [makeBuyerOrderItem({ price: 50, quantity: 2 })],
        }),
      ],
      totalPrice: 100,
    })
    const summary = buildBuyerOrderViewModel(order)
    mockUseBuyerOrdersTableSelector.mockReturnValue(
      createTableState({
        filteredOrders: [order],
        summariesByOrderId: new Map([[order.orderId, summary]]),
      }),
    )

    render(<OrdersMobileList />)

    expect(screen.getByText(summary.orderDate)).toBeInTheDocument()
    expect(screen.getByText(summary.orderTime)).toBeInTheDocument()
    expect(screen.getByText("Processing")).toBeInTheDocument()
    expect(screen.getByText("Acme Dental")).toBeInTheDocument()
    expect(screen.getByText("2 items")).toBeInTheDocument()
    expect(screen.getByText("$100.00")).toBeInTheDocument()
  })

  it("renders the auto-order badge only when the order was placed automatically", () => {
    const order = makeBuyerOrder({ autoOrder: true })
    mockUseBuyerOrdersTableSelector.mockReturnValue(createTableState({ filteredOrders: [order] }))

    render(<OrdersMobileList />)

    expect(screen.getByText("Auto")).toBeInTheDocument()
  })

  it("does not render the auto-order badge when the order was placed manually", () => {
    const order = makeBuyerOrder({ autoOrder: false })
    mockUseBuyerOrdersTableSelector.mockReturnValue(createTableState({ filteredOrders: [order] }))

    render(<OrdersMobileList />)

    expect(screen.queryByText("Auto")).not.toBeInTheDocument()
  })

  it.each([
    ["shows a 'Free shipping' label when the order has no shipping cost", 0, "Free shipping"],
    ["shows the shipping amount when the order was charged for shipping", 15, "+$15.00 shipping"],
  ])("%s", (_label, shipmentPrice, expectedText) => {
    const order = makeBuyerOrder({
      sellerGroups: [
        makeBuyerOrderSellerGroup({
          orderItems: [makeBuyerOrderItem({ shipmentPrice, shipmentFreeBySeller: false, quantity: 1 })],
        }),
      ],
    })
    mockUseBuyerOrdersTableSelector.mockReturnValue(createTableState({ filteredOrders: [order] }))

    render(<OrdersMobileList />)

    expect(screen.getByText(expectedText)).toBeInTheDocument()
  })

  it("does not multiply shipmentPrice by quantity and includes the heavy shipment fee in the shipping line", () => {
    const order = makeBuyerOrder({
      sellerGroups: [
        makeBuyerOrderSellerGroup({
          orderItems: [
            makeBuyerOrderItem({
              shipmentPrice: 12.99,
              quantity: 2,
              takedHeavyShipmentFee: 50,
              shipmentFreeBySeller: false,
            }),
          ],
        }),
      ],
    })
    mockUseBuyerOrdersTableSelector.mockReturnValue(createTableState({ filteredOrders: [order] }))

    render(<OrdersMobileList />)

    // shippingTotal (12.99, NOT *2) + heavyShipmentTotal (50) = 62.99.
    expect(screen.getByText("+$62.99 shipping")).toBeInTheDocument()
  })

  it("renders a '+N more' hint when the order has more than one seller", () => {
    const order = makeBuyerOrder({
      sellerGroups: [
        makeBuyerOrderSellerGroup({ sellerName: "Acme", sellerSurname: "Store" }),
        makeBuyerOrderSellerGroup({ sellerId: "seller-2", sellerName: "Beta", sellerSurname: "Supply" }),
      ],
    })
    mockUseBuyerOrdersTableSelector.mockReturnValue(createTableState({ filteredOrders: [order] }))

    render(<OrdersMobileList />)

    expect(screen.getByText("+1 more")).toBeInTheDocument()
  })
})

describe("OrdersMobileList — sort interaction", () => {
  it("calls handleSort with 'createdDate' when the Date sort button is clicked", async () => {
    const user = userEvent.setup()
    const actions = defaultActions()
    mockUseBuyerOrdersTableActions.mockReturnValue(actions)
    mockUseBuyerOrdersTableSelector.mockReturnValue(createTableState({ filteredOrders: [makeBuyerOrder()] }))

    render(<OrdersMobileList />)
    await user.click(screen.getByRole("button", { name: /Date/i }))

    expect(actions.handleSort).toHaveBeenCalledWith("createdDate")
  })

  it("calls handleSort with 'totalPrice' when the Net Total sort button is clicked", async () => {
    const user = userEvent.setup()
    const actions = defaultActions()
    mockUseBuyerOrdersTableActions.mockReturnValue(actions)
    mockUseBuyerOrdersTableSelector.mockReturnValue(createTableState({ filteredOrders: [makeBuyerOrder()] }))

    render(<OrdersMobileList />)
    await user.click(screen.getByRole("button", { name: /Net Total/i }))

    expect(actions.handleSort).toHaveBeenCalledWith("totalPrice")
  })

  it("marks the active sort field's button distinctly from the inactive one", () => {
    mockUseBuyerOrdersTableSelector.mockReturnValue(
      createTableState({ sortField: "createdDate", sortDir: "desc", filteredOrders: [makeBuyerOrder()] }),
    )

    render(<OrdersMobileList />)

    const dateButton = screen.getByRole("button", { name: /Date/i })
    const totalButton = screen.getByRole("button", { name: /Net Total/i })
    expect(dateButton.className).toContain("bg-brand/10")
    expect(totalButton.className).not.toContain("bg-brand/10")
  })
})

describe("OrdersMobileList — expand/collapse interaction", () => {
  it("calls handleExpandedChange with the toggled state for that order when the card is clicked", async () => {
    const user = userEvent.setup()
    const actions = defaultActions()
    mockUseBuyerOrdersTableActions.mockReturnValue(actions)
    const order = makeBuyerOrder({ orderId: "order-99" })
    mockUseBuyerOrdersTableSelector.mockReturnValue(createTableState({ filteredOrders: [order], expandedState: {} }))

    render(<OrdersMobileList />)
    const trigger = screen.getByRole("button", { expanded: false })
    await user.click(trigger)

    expect(actions.handleExpandedChange).toHaveBeenCalledWith({ "order-99": true })
  })

  it("reflects the expanded state from context in aria-expanded and the chevron direction", () => {
    const order = makeBuyerOrder({ orderId: "order-99" })
    mockUseBuyerOrdersTableSelector.mockReturnValue(
      createTableState({ filteredOrders: [order], expandedState: { "order-99": true } }),
    )

    render(<OrdersMobileList />)

    expect(screen.getByRole("button", { expanded: true })).toBeInTheDocument()
  })
})

describe("OrdersMobileList — C axis: hostile data does not crash the page", () => {
  const baseOrder = () => makeBuyerOrder({ orderId: "order-hostile" })

  it.each<[string, Partial<BuyerOrder>]>([
    ["orderItems missing entirely", { orderItems: undefined, sellerGroups: [makeBuyerOrderSellerGroup()] }],
    ["orderItems is null", { orderItems: null as unknown as undefined, sellerGroups: undefined }],
    ["orderItems is not an array (object)", { orderItems: {} as unknown as undefined, sellerGroups: undefined }],
    ["sellerGroups missing entirely", { sellerGroups: undefined, orderItems: [makeBuyerOrderItem()] }],
    ["sellerGroups is null", { sellerGroups: null as unknown as undefined, orderItems: [makeBuyerOrderItem()] }],
    [
      "sellerGroups is not an array (string)",
      { sellerGroups: "not-an-array" as unknown as undefined, orderItems: [makeBuyerOrderItem()] },
    ],
    ["both orderItems and sellerGroups missing", { orderItems: undefined, sellerGroups: undefined }],
    ["createdDate is a corrupt string", { createdDate: "not-a-real-date" }],
    ["createdDate is missing", { createdDate: undefined as unknown as string }],
    ["totalPrice is null", { totalPrice: null as unknown as number }],
    ["totalPrice is NaN", { totalPrice: Number.NaN }],
    ["orderStatus is null", { orderStatus: null as unknown as string }],
    ["orderStatus is missing", { orderStatus: undefined as unknown as string }],
  ])("does not crash when %s", (_label, overrides) => {
    const order = { ...baseOrder(), ...overrides }
    // Force the component's cache-miss path (`summariesByOrderId.get(...) ?? buildBuyerOrderViewModel(order)`)
    // so the hostile order actually flows through the real view-model builder, the same as it would
    // on a genuine cache miss in production.
    mockUseBuyerOrdersTableSelector.mockReturnValue(
      createTableState({ filteredOrders: [order], summariesByOrderId: new Map() }),
    )

    expect(() => render(<OrdersMobileList />)).not.toThrow()
    // The card must show a real state, not a blank card — this is exactly what F77/F99 broke.
    expect(screen.getByRole("button", { expanded: false })).toBeInTheDocument()
  })

  it("does not crash and shows an item-level status tag even for an unrecognised status enum from the backend", () => {
    const order = makeBuyerOrder({
      sellerGroups: [
        makeBuyerOrderSellerGroup({
          orderItems: [makeBuyerOrderItem({ status: "SOME_FUTURE_BACKEND_STATUS" })],
        }),
      ],
    })
    mockUseBuyerOrdersTableSelector.mockReturnValue(
      createTableState({ filteredOrders: [order], summariesByOrderId: new Map() }),
    )

    expect(() => render(<OrdersMobileList />)).not.toThrow()
  })

  it("renders a dash/fallback rather than crashing on a malformed order date across all visible cards", () => {
    const orders = [
      makeBuyerOrder({ orderId: "a", createdDate: "not-a-date" }),
      makeBuyerOrder({ orderId: "b", createdDate: "" as unknown as string }),
    ]
    mockUseBuyerOrdersTableSelector.mockReturnValue(
      createTableState({ filteredOrders: orders, summariesByOrderId: new Map() }),
    )

    render(<OrdersMobileList />)

    const dashes = screen.getAllByText("-")
    expect(dashes.length).toBeGreaterThanOrEqual(2)
  })
})
