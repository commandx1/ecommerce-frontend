import type { ExpandedState } from "@tanstack/react-table"
import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { type HTMLAttributes, type ReactNode, useMemo, useState } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { BuyerOrder } from "@/lib/api/buyer-orders"
import { buildBuyerOrderViewModel } from "../lib/order-view-utils"
import OrdersTable from "./orders-table"

const mockUseBuyerOrdersTableState = vi.fn()
const mockUseBuyerOrdersTableActions = vi.fn()

vi.mock("../context/buyer-orders-context", () => ({
  useBuyerOrdersTableSelector: (
    selector: (state: ReturnType<typeof mockUseBuyerOrdersTableState>) => unknown,
  ) => selector(mockUseBuyerOrdersTableState()),
  useBuyerOrdersTableActions: () => mockUseBuyerOrdersTableActions(),
}))

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: ReactNode; href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

vi.mock("@/features/products/listing/components/ProductImageWithFallback", () => ({
  default: ({ alt }: { alt: string }) => <div role="img" aria-label={alt} />,
}))

vi.mock("motion/react", () => ({
  AnimatePresence: ({ children }: { children: ReactNode }) => <>{children}</>,
  motion: {
    div: ({ children, ...props }: HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
  },
  useReducedMotion: () => true,
}))

const baseAddress = {
  title: "Home",
  fullName: "Jane Doe",
  phoneNumber: "5551234567",
  country: "TR",
  city: "Istanbul",
  district: "Kadikoy",
  postalCode: "34000",
  addressLine: "Bagdat Caddesi 10",
  formattedAddress: "Bagdat Caddesi 10, Kadikoy / Istanbul",
  latitude: 0,
  longitude: 0,
  placeId: "place-1",
}

const order: BuyerOrder = {
  orderId: "order-1",
  totalPrice: 240,
  orderStatus: "PAID",
  createdDate: "2026-05-20T10:30:00Z",
  addressTitle: "Home",
  addressFormattedAddress: "Bagdat Caddesi 10, Kadikoy / Istanbul",
  shipmentAddress: baseAddress,
  billingAddress: baseAddress,
  cardName: "Jane Doe",
  cardBrand: "visa",
  cardLast4: "4242",
  cardExpMonth: 12,
  cardExpYear: 2030,
  sellerGroups: [
    {
      sellerId: "seller-1",
      sellerName: "Acme",
      sellerSurname: "Store",
      orderItems: [
        {
          id: "item-1",
          userProductId: "up-1",
          productId: "product-1",
          productName: "Dental Kit",
          price: 100,
          quantity: 2,
          status: "WAITING_FOR_SHIPMENT",
          productCoverPhotoPath: "/img-1.jpg",
          sellerName: "Acme",
          sellerSurname: "Store",
          shipmentPrice: 5,
          shipmentFreeBySeller: false,
          trackingLinks: [
            { trackingUrl: "https://track.example/1", status: "IN_TRANSIT", updatedDate: "2026-05-20T11:00:00Z" },
          ],
          updatedDate: "2026-05-20T11:00:00Z",
        },
        {
          id: "item-2",
          userProductId: "up-2",
          productId: "product-2",
          productName: "Toothpaste",
          price: 30,
          quantity: 1,
          status: "DELIVERED",
          productCoverPhotoPath: "/img-2.jpg",
          sellerName: "Acme",
          sellerSurname: "Store",
          shipmentPrice: 0,
          shipmentFreeBySeller: true,
          updatedDate: "2026-05-20T11:10:00Z",
        },
      ],
    },
  ],
}

const secondOrder: BuyerOrder = {
  ...order,
  orderId: "order-2",
  createdDate: "2026-05-21T10:30:00Z",
  totalPrice: 80,
  sellerGroups: [
    {
      sellerId: "seller-2",
      sellerName: "Beta",
      sellerSurname: "Market",
      orderItems: [
        {
          id: "item-3",
          userProductId: "up-3",
          productId: "product-3",
          productName: "Mouthwash",
          price: 80,
          quantity: 1,
          status: "DELIVERED",
          productCoverPhotoPath: "/img-3.jpg",
          sellerName: "Beta",
          sellerSurname: "Market",
          shipmentPrice: 0,
          shipmentFreeBySeller: true,
          updatedDate: "2026-05-21T11:00:00Z",
        },
      ],
    },
  ],
}

type TableState = ReturnType<typeof mockUseBuyerOrdersTableState>
type TableActions = ReturnType<typeof mockUseBuyerOrdersTableActions>

function createTableState(overrides?: Partial<TableState>) {
  return {
    cancelingItemId: null,
    cancelingSellerKey: null,
    dateSortDir: "desc" as const,
    expandedState: {},
    filteredOrders: [order],
    isLoading: false,
    reorderingItemId: null,
    summariesByOrderId: new Map([[order.orderId, buildBuyerOrderViewModel(order)]]),
    ...overrides,
  }
}

function createTableActions(overrides?: Partial<TableActions>) {
  return {
    handleDateSortToggle: vi.fn(),
    handleExpandedChange: vi.fn(),
    handleReorder: vi.fn().mockResolvedValue(undefined),
    requestCancelAction: vi.fn(),
    requestRefundAction: vi.fn(),
    setTrackingModalLinks: vi.fn(),
    ...overrides,
  }
}

function configureTableMocks(stateOverrides?: Partial<TableState>, actionOverrides?: Partial<TableActions>) {
  mockUseBuyerOrdersTableState.mockReturnValue(createTableState(stateOverrides))
  mockUseBuyerOrdersTableActions.mockReturnValue(createTableActions(actionOverrides))
}

function StatefulTableHarness({
  testOrders = [order],
  onReorder = vi.fn().mockResolvedValue(undefined),
  onRequestCancel = vi.fn(),
  onSetTrackingModalLinks = vi.fn(),
  onRequestRefund = vi.fn(),
  dateSortDir = "desc" as const,
}: {
  dateSortDir?: "asc" | "desc"
  onReorder?: (userProductId: string, quantity: number, productName: string) => Promise<void>
  onRequestCancel?: (action: {
    description: string
    orderItemIds: string[]
    options?: { cancelingItemId?: string; cancelingSellerKey?: string }
  }) => void
  onRequestRefund?: (order: BuyerOrder) => void
  onSetTrackingModalLinks?: (links: Array<{ trackingUrl: string; status?: string; updatedDate?: string | null }>) => void
  testOrders?: BuyerOrder[]
}) {
  const [expandedState, setExpandedState] = useState<ExpandedState>({})
  const handleExpandedChange = (nextExpanded: ExpandedState | ((old: ExpandedState) => ExpandedState)) => {
    const resolved = typeof nextExpanded === "function" ? nextExpanded(expandedState) : nextExpanded
    if (resolved === true) {
      setExpandedState({})
      return
    }
    const resolvedMap = resolved as Record<string, boolean>
    const expandedRowIds = Object.keys(resolvedMap).filter((rowId) => Boolean(resolvedMap[rowId]))
    const singleExpandedRowId = expandedRowIds[expandedRowIds.length - 1]
    setExpandedState(singleExpandedRowId ? { [singleExpandedRowId]: true } : {})
  }

  const summariesByOrderId = useMemo(
    () => new Map(testOrders.map((item) => [item.orderId, buildBuyerOrderViewModel(item)] as const)),
    [testOrders],
  )

  configureTableMocks(
    {
      dateSortDir,
      expandedState,
      filteredOrders: testOrders,
      summariesByOrderId,
    },
    {
      handleExpandedChange,
      handleReorder: onReorder,
      requestCancelAction: onRequestCancel,
      requestRefundAction: onRequestRefund,
      setTrackingModalLinks: onSetTrackingModalLinks,
    },
  )

  return <OrdersTable />
}

function getPrimaryDataRowBySeller(seller: string): HTMLTableRowElement | null {
  const rows = screen.getAllByRole("row")
  for (const row of rows) {
    if (within(row).queryByText(seller) && row.querySelectorAll("td").length > 1) {
      return row as HTMLTableRowElement
    }
  }
  return null
}

beforeEach(() => {
  mockUseBuyerOrdersTableState.mockReset()
  mockUseBuyerOrdersTableActions.mockReset()
})

describe("OrdersTable", () => {
  it("renders loading state and empty state correctly", () => {
    configureTableMocks({ isLoading: true })
    const { rerender } = render(<OrdersTable />)
    expect(screen.getByText("Loading orders...")).toBeInTheDocument()

    configureTableMocks({ filteredOrders: [], isLoading: false, summariesByOrderId: new Map() })
    rerender(<OrdersTable />)
    expect(screen.getByText("No orders found.")).toBeInTheDocument()
  })

  it("renders all buyer orders table columns and summary row values", () => {
    configureTableMocks()
    render(<OrdersTable />)

    for (const header of [
      "Date",
      "Seller / Store",
      "Items",
      "Payment Method",
      "Payment Status",
      "Tracking",
      "Net Total",
      "Shipment Fee",
    ]) {
      expect(screen.getByText(header)).toBeInTheDocument()
    }

    expect(screen.getByText("Acme Store")).toBeInTheDocument()
    expect(screen.getByText("3 items")).toBeInTheDocument()
    expect(screen.getByText("2 line item(s)")).toBeInTheDocument()
    expect(screen.getByText("VISA •••• 4242")).toBeInTheDocument()
    expect(screen.getByText("Paid")).toBeInTheDocument()
    expect(screen.getByText("1 link")).toBeInTheDocument()
    expect(screen.getByText("$240.00")).toBeInTheDocument()
    expect(screen.getByText("$10.00")).toBeInTheDocument()
  })

  it("triggers date sort toggle when date header is clicked", async () => {
    const user = userEvent.setup()
    const handleDateSortToggle = vi.fn()
    configureTableMocks(undefined, { handleDateSortToggle })
    render(<OrdersTable />)

    await user.click(screen.getByRole("button", { name: "Sort by date ascending" }))
    expect(handleDateSortToggle).toHaveBeenCalledTimes(1)
  })

  it("updates sort button aria-label based on sort direction", () => {
    configureTableMocks({ dateSortDir: "desc" })
    const { rerender } = render(<OrdersTable />)
    expect(screen.getByRole("button", { name: "Sort by date ascending" })).toBeInTheDocument()

    configureTableMocks({ dateSortDir: "asc" })
    rerender(<OrdersTable />)
    expect(screen.getByRole("button", { name: "Sort by date descending" })).toBeInTheDocument()
  })

  it("shows tracking fallback when an order has no tracking links", () => {
    const summary = buildBuyerOrderViewModel(secondOrder)
    configureTableMocks({
      filteredOrders: [secondOrder],
      summariesByOrderId: new Map([[secondOrder.orderId, summary]]),
    })
    render(<OrdersTable />)
    expect(screen.getByText("No tracking yet")).toBeInTheDocument()
  })

  it("shows expanded section details and triggers expand-area actions", async () => {
    const user = userEvent.setup()
    const onReorder = vi.fn().mockResolvedValue(undefined)
    const onSetTrackingModalLinks = vi.fn()
    const onRequestCancel = vi.fn()
    render(
      <StatefulTableHarness
        onReorder={onReorder}
        onRequestCancel={onRequestCancel}
        onSetTrackingModalLinks={onSetTrackingModalLinks}
      />,
    )

    const row = screen.getByText("Acme Store").closest("tr")
    expect(row).not.toBeNull()
    await user.click(within(row as HTMLTableRowElement).getByRole("button"))

    expect(await screen.findByText("Order Items")).toBeInTheDocument()
    expect(screen.getByText("Dental Kit")).toBeInTheDocument()
    expect(screen.getByText("Toothpaste")).toBeInTheDocument()
    expect(screen.getAllByText("Fulfillment").length).toBeGreaterThan(0)
    expect(screen.getByText("Customer Details")).toBeInTheDocument()

    await user.click(screen.getAllByRole("button", { name: "Reorder" })[0])
    expect(onReorder).toHaveBeenCalledWith("up-1", 2, "Dental Kit")

    await user.click(screen.getByRole("button", { name: "Track" }))
    expect(onSetTrackingModalLinks).toHaveBeenCalledWith([
      {
        trackingUrl: "https://track.example/1",
        status: "IN_TRANSIT",
        updatedDate: "2026-05-20T11:00:00Z",
      },
    ])

    await user.click(screen.getByRole("button", { name: "Cancel Item" }))
    expect(onRequestCancel).toHaveBeenCalledWith({
      orderItemIds: ["item-1"],
      description: "Dental Kit cancellation request was submitted.",
      options: { cancelingItemId: "item-1" },
    })

    await user.click(screen.getByRole("button", { name: "Cancel All Items from Acme Store" }))
    expect(onRequestCancel).toHaveBeenCalledWith({
      orderItemIds: ["item-1"],
      description: "Acme Store items cancellation request was submitted.",
      options: { cancelingSellerKey: "order-1:seller-1" },
    })
  })

  it("collapses when same row expander is clicked twice", async () => {
    const user = userEvent.setup()
    render(<StatefulTableHarness testOrders={[order, secondOrder]} />)

    const firstRow = getPrimaryDataRowBySeller("Acme Store")
    expect(firstRow).not.toBeNull()
    await user.click(within(firstRow as HTMLTableRowElement).getByRole("button"))
    expect(await screen.findByText("Order Items")).toBeInTheDocument()

    const firstRowAfterExpand = getPrimaryDataRowBySeller("Acme Store")
    expect(firstRowAfterExpand).not.toBeNull()
    await user.click(within(firstRowAfterExpand as HTMLTableRowElement).getByRole("button"))
    await waitFor(() => {
      expect(screen.queryByText("Order Items")).not.toBeInTheDocument()
    })
  })

  it("keeps single-expand behavior when another row is opened", async () => {
    const user = userEvent.setup()
    render(<StatefulTableHarness testOrders={[order, secondOrder]} />)

    const firstRow = getPrimaryDataRowBySeller("Acme Store")
    const secondRow = getPrimaryDataRowBySeller("Beta Market")
    expect(firstRow).not.toBeNull()
    expect(secondRow).not.toBeNull()

    await user.click(within(firstRow as HTMLTableRowElement).getByRole("button"))
    expect(await screen.findByText("Dental Kit")).toBeInTheDocument()

    const secondRowAfterFirstExpand = getPrimaryDataRowBySeller("Beta Market")
    expect(secondRowAfterFirstExpand).not.toBeNull()
    await user.click(within(secondRowAfterFirstExpand as HTMLTableRowElement).getByRole("button"))
    expect(await screen.findByText("Mouthwash")).toBeInTheDocument()
    expect(screen.queryByText("Dental Kit")).not.toBeInTheDocument()
  })

  it("does not show Cancel Item for non-cancelable statuses", async () => {
    const user = userEvent.setup()
    render(<StatefulTableHarness testOrders={[secondOrder]} />)

    const row = screen.getByText("Beta Market").closest("tr")
    expect(row).not.toBeNull()
    await user.click(within(row as HTMLTableRowElement).getByRole("button"))

    expect(await screen.findByText("Mouthwash")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Cancel Item" })).not.toBeInTheDocument()
  })
})
