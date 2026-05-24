import type { ExpandedState } from "@tanstack/react-table"
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { type HTMLAttributes, type ReactNode, useState } from "react"
import { describe, expect, it, vi } from "vitest"
import type { BuyerOrder } from "@/lib/api/buyer-orders"
import { buildBuyerOrderViewModel } from "../lib/order-view-utils"
import OrdersTable from "./orders-table"

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

interface OrdersTableHarnessProps {
  onOpenTrackingLinks: (links: Array<{ trackingUrl: string; status?: string; updatedDate?: string | null }>) => void
  onReorder: (userProductId: string, quantity: number, productName: string) => Promise<void>
  onRequestCancel: (action: {
    description: string
    orderItemIds: string[]
    options?: { cancelingItemId?: string; cancelingSellerKey?: string }
  }) => void
}

function OrdersTableHarness({ onOpenTrackingLinks, onReorder, onRequestCancel }: OrdersTableHarnessProps) {
  const [expandedState, setExpandedState] = useState<ExpandedState>({})
  const summary = buildBuyerOrderViewModel(order)

  return (
    <OrdersTable
      cancelingItemId={null}
      cancelingSellerKey={null}
      dateSortDir="desc"
      expandedState={expandedState}
      isLoading={false}
      onDateSortToggle={vi.fn()}
      onExpandedChange={setExpandedState}
      onOpenTrackingLinks={onOpenTrackingLinks}
      onReorder={onReorder}
      onRequestCancel={onRequestCancel}
      orders={[order]}
      reorderingItemId={null}
      summariesByOrderId={new Map([[order.orderId, summary]])}
    />
  )
}

describe("OrdersTable", () => {
  it("renders loading state and empty state correctly", () => {
    const summary = buildBuyerOrderViewModel(order)

    const { rerender } = render(
      <OrdersTable
        cancelingItemId={null}
        cancelingSellerKey={null}
        dateSortDir="desc"
        expandedState={{}}
        isLoading
        onDateSortToggle={vi.fn()}
        onExpandedChange={vi.fn()}
        onOpenTrackingLinks={vi.fn()}
        onReorder={vi.fn().mockResolvedValue(undefined)}
        onRequestCancel={vi.fn()}
        orders={[order]}
        reorderingItemId={null}
        summariesByOrderId={new Map([[order.orderId, summary]])}
      />,
    )

    expect(screen.getByText("Loading orders...")).toBeInTheDocument()

    rerender(
      <OrdersTable
        cancelingItemId={null}
        cancelingSellerKey={null}
        dateSortDir="desc"
        expandedState={{}}
        isLoading={false}
        onDateSortToggle={vi.fn()}
        onExpandedChange={vi.fn()}
        onOpenTrackingLinks={vi.fn()}
        onReorder={vi.fn().mockResolvedValue(undefined)}
        onRequestCancel={vi.fn()}
        orders={[]}
        reorderingItemId={null}
        summariesByOrderId={new Map()}
      />,
    )

    expect(screen.getByText("No orders found.")).toBeInTheDocument()
  })

  it("renders all buyer orders table columns and summary row values", () => {
    render(
      <OrdersTableHarness
        onOpenTrackingLinks={vi.fn()}
        onReorder={vi.fn().mockResolvedValue(undefined)}
        onRequestCancel={vi.fn()}
      />,
    )

    const expectedHeaders = [
      "Date",
      "Seller / Store",
      "Items",
      "Payment Method",
      "Payment Status",
      "Shipment Status",
      "Tracking",
      "Net Total",
      "Shipment Fee",
    ]

    for (const header of expectedHeaders) {
      expect(screen.getByText(header)).toBeInTheDocument()
    }

    expect(screen.getByText("Acme Store")).toBeInTheDocument()
    expect(screen.getByText("3 items")).toBeInTheDocument()
    expect(screen.getByText("2 line item(s)")).toBeInTheDocument()
    expect(screen.getByText("VISA •••• 4242")).toBeInTheDocument()
    expect(screen.getByText("Paid")).toBeInTheDocument()
    expect(screen.getByText("Delivered")).toBeInTheDocument()
    expect(screen.getByText("1 link")).toBeInTheDocument()
    expect(screen.getByText("$240.00")).toBeInTheDocument()
    expect(screen.getByText("$10.00")).toBeInTheDocument()
  })

  it("triggers date sort toggle when date header is clicked", async () => {
    const user = userEvent.setup()
    const onDateSortToggle = vi.fn()
    const summary = buildBuyerOrderViewModel(order)

    render(
      <OrdersTable
        cancelingItemId={null}
        cancelingSellerKey={null}
        dateSortDir="desc"
        expandedState={{}}
        isLoading={false}
        onDateSortToggle={onDateSortToggle}
        onExpandedChange={vi.fn()}
        onOpenTrackingLinks={vi.fn()}
        onReorder={vi.fn().mockResolvedValue(undefined)}
        onRequestCancel={vi.fn()}
        orders={[order]}
        reorderingItemId={null}
        summariesByOrderId={new Map([[order.orderId, summary]])}
      />,
    )

    await user.click(screen.getByRole("button", { name: "Sort by date ascending" }))
    expect(onDateSortToggle).toHaveBeenCalledTimes(1)
  })

  it("shows expanded section details and triggers expand-area actions", async () => {
    const user = userEvent.setup()
    const onReorder = vi.fn().mockResolvedValue(undefined)
    const onOpenTrackingLinks = vi.fn()
    const onRequestCancel = vi.fn()

    render(
      <OrdersTableHarness
        onOpenTrackingLinks={onOpenTrackingLinks}
        onReorder={onReorder}
        onRequestCancel={onRequestCancel}
      />,
    )

    const sellerCell = screen.getByText("Acme Store")
    const row = sellerCell.closest("tr")
    expect(row).not.toBeNull()

    const expandButton = within(row as HTMLTableRowElement).getByRole("button")
    await user.click(expandButton)

    expect(await screen.findByText("Order Items")).toBeInTheDocument()
    expect(screen.getByText("Dental Kit")).toBeInTheDocument()
    expect(screen.getByText("Toothpaste")).toBeInTheDocument()
    expect(screen.getAllByText("Fulfillment").length).toBeGreaterThan(0)
    expect(screen.getByText("Customer Details")).toBeInTheDocument()

    await user.click(screen.getAllByRole("button", { name: "Reorder" })[0])
    expect(onReorder).toHaveBeenCalledWith("up-1", 2, "Dental Kit")

    await user.click(screen.getByRole("button", { name: "Track" }))
    expect(onOpenTrackingLinks).toHaveBeenCalledWith([
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
})
