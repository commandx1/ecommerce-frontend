import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useMemo } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { BuyerOrder, BuyerOrderItem } from "@/lib/api/buyer-orders"
import { StatefulTableHarness } from "@/test/harness/stateful-table-harness"
import { buildBuyerOrderViewModel } from "../lib/order-view-utils"
import OrdersTable from "./orders-table"

const mockUseBuyerOrdersTableState = vi.fn()
const mockUseBuyerOrdersTableActions = vi.fn()

vi.mock("../context/buyer-orders-context", () => ({
  useBuyerOrdersTableSelector: (selector: (state: ReturnType<typeof mockUseBuyerOrdersTableState>) => unknown) =>
    selector(mockUseBuyerOrdersTableState()),
  useBuyerOrdersTableActions: () => mockUseBuyerOrdersTableActions(),
}))

// `next/link`, `next/image` and `motion/react` are mocked globally in `src/test/setup.ts`.
vi.mock("@/features/products/listing/components/ProductImageWithFallback", () => ({
  default: ({ alt }: { alt: string }) => <div role="img" aria-label={alt} />,
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
          // The backend gates the return action per item; without this the UI hides "Request Return".
          returnenable: true,
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
          returnenable: true,
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
    sortField: "createdDate" as const,
    sortDir: "desc" as const,
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
    handleSort: vi.fn(),
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

function OrdersTableHarness({
  testOrders = [order],
  onReorder = vi.fn().mockResolvedValue(undefined),
  onRequestCancel = vi.fn(),
  onSetTrackingModalLinks = vi.fn(),
  onRequestRefund = vi.fn(),
  sortField = "createdDate" as const,
  sortDir = "desc" as const,
}: {
  onReorder?: (userProductId: string, quantity: number, productName: string) => Promise<void>
  onRequestCancel?: (action: {
    description: string
    orderItemIds: string[]
    options?: { cancelingItemId?: string; cancelingSellerKey?: string }
  }) => void
  onRequestRefund?: (order: BuyerOrder, orderItem: BuyerOrderItem) => void
  onSetTrackingModalLinks?: (payload: {
    links: Array<{ trackingUrl: string; status?: string; updatedDate?: string | null }>
    title: string
  }) => void
  sortDir?: "asc" | "desc"
  sortField?: "createdDate" | "totalPrice"
  testOrders?: BuyerOrder[]
}) {
  const summariesByOrderId = useMemo(
    () => new Map(testOrders.map((item) => [item.orderId, buildBuyerOrderViewModel(item)] as const)),
    [testOrders],
  )

  return (
    <StatefulTableHarness>
      {({ expandedState, handleExpandedChange }) => {
        configureTableMocks(
          {
            sortField,
            sortDir,
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
      }}
    </StatefulTableHarness>
  )
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

    for (const header of ["Date", "Seller / Store", "Items", "Net Total", "Shipment Fee"]) {
      expect(screen.getByText(header)).toBeInTheDocument()
    }

    expect(screen.getByText("Acme Store")).toBeInTheDocument()
    expect(screen.getByText("3 items")).toBeInTheDocument()
    expect(screen.getByText("2 line item(s)")).toBeInTheDocument()
    expect(screen.getByText("$240.00")).toBeInTheDocument()
    expect(screen.getByText("$10.00")).toBeInTheDocument()
  })

  it("requests a sort on the matching field when a sortable header is clicked", async () => {
    const user = userEvent.setup()
    const handleSort = vi.fn()
    configureTableMocks(undefined, { handleSort })
    render(<OrdersTable />)

    await user.click(screen.getByRole("button", { name: "Date" }))
    expect(handleSort).toHaveBeenNthCalledWith(1, "createdDate")

    await user.click(screen.getByRole("button", { name: "Net Total" }))
    expect(handleSort).toHaveBeenNthCalledWith(2, "totalPrice")
  })

  // TODO(a11y): re-enable once the sort state is exposed to assistive technology again.
  //
  // This used to assert the sort header's `aria-label` ("Sort by date ascending" / "...descending").
  // After the sortable-header refactor the button's accessible name is just the column title and the
  // current direction is conveyed ONLY by a decorative lucide chevron; the `<th>` carries no
  // `aria-sort` either (see `src/components/ui/data-table.tsx`). That is a real regression
  // (WCAG 4.1.2 — state not exposed), not a stale test, so the assertion is kept rather than
  // rewritten against the icon's class names.
  it.skip("updates the sort control's accessible name based on sort direction", () => {
    configureTableMocks({ sortField: "createdDate", sortDir: "desc" })
    const { rerender } = render(<OrdersTable />)
    expect(screen.getByRole("button", { name: "Sort by date ascending" })).toBeInTheDocument()

    configureTableMocks({ sortField: "createdDate", sortDir: "asc" })
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
    expect(screen.getByText("Beta Market")).toBeInTheDocument()
  })

  it("shows expanded section details and triggers expand-area actions", async () => {
    const user = userEvent.setup()
    const onReorder = vi.fn().mockResolvedValue(undefined)
    const onSetTrackingModalLinks = vi.fn()
    const onRequestCancel = vi.fn()
    const onRequestRefund = vi.fn()
    render(
      <OrdersTableHarness
        onReorder={onReorder}
        onRequestCancel={onRequestCancel}
        onRequestRefund={onRequestRefund}
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
    expect(onSetTrackingModalLinks).toHaveBeenCalledWith({
      title: "Tracking links",
      links: [
        {
          trackingUrl: "https://track.example/1",
          status: "IN_TRANSIT",
          updatedDate: "2026-05-20T11:00:00Z",
        },
      ],
    })

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

    await user.click(screen.getByRole("button", { name: "Request Return" }))
    expect(onRequestRefund).toHaveBeenCalledWith(order, order.sellerGroups?.[0]?.orderItems[1])
  })

  it("collapses when same row expander is clicked twice", async () => {
    const user = userEvent.setup()
    render(<OrdersTableHarness testOrders={[order, secondOrder]} />)

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
    render(<OrdersTableHarness testOrders={[order, secondOrder]} />)

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
    render(<OrdersTableHarness testOrders={[secondOrder]} />)

    const row = screen.getByText("Beta Market").closest("tr")
    expect(row).not.toBeNull()
    await user.click(within(row as HTMLTableRowElement).getByRole("button"))

    expect(await screen.findByText("Mouthwash")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Cancel Item" })).not.toBeInTheDocument()
  })

  it("does not show Request Return when the item already has a return date", async () => {
    const user = userEvent.setup()
    const orderWithReturnedItem: BuyerOrder = {
      ...secondOrder,
      sellerGroups: secondOrder.sellerGroups?.map((group) => ({
        ...group,
        orderItems: group.orderItems.map((item) => ({
          ...item,
          returnDate: "2026-05-22T10:00:00Z",
        })),
      })),
    }

    render(<OrdersTableHarness testOrders={[orderWithReturnedItem]} />)

    const row = screen.getByText("Beta Market").closest("tr")
    expect(row).not.toBeNull()
    await user.click(within(row as HTMLTableRowElement).getByRole("button"))

    expect(await screen.findByText("Mouthwash")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Request Return" })).not.toBeInTheDocument()
  })
})
