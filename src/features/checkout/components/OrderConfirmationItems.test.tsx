import { beforeEach, describe, expect, it, vi } from "vitest"
import type { OrderItem, PlaceOrderResponse } from "@/lib/api/orders"
import { render, screen } from "@/test/render"
import OrderConfirmationItems from "./OrderConfirmationItems"

const baseItem = (overrides: Partial<OrderItem> = {}): OrderItem => ({
  id: "item-1",
  userProductId: "user-product-1",
  productId: "product-1",
  productName: "Composite Kit",
  productCoverPhotoPath: "/uploads/composite-kit.png",
  price: 42.5,
  quantity: 2,
  status: "PROCESSING",
  shippingLink: [],
  trackingLink: [],
  updatedDate: null,
  ...overrides,
})

const orderResult = (overrides: Partial<PlaceOrderResponse> = {}): PlaceOrderResponse => ({
  orderId: "order-1",
  totalPrice: 85,
  status: "PENDING_PAYMENT",
  createdDate: "2026-08-27T10:00:00Z",
  orderItems: [baseItem()],
  ...overrides,
})

// Any string rendered onto the page as the literal word "null"/"undefined" is a bug (F101) — this
// asserts the whole rendered tree never contains one, regardless of which field went bad. The
// `next-themes` no-flash script (injected by the shared `ThemeProvider` test wrapper) legitimately
// contains the token "null" in its own source, so it is stripped before comparing.
const expectNoRawNullText = (container: HTMLElement) => {
  const clone = container.cloneNode(true) as HTMLElement
  clone.querySelectorAll("script").forEach((node) => {
    node.remove()
  })
  expect(clone.textContent).not.toMatch(/\bnull\b/i)
  expect(clone.textContent).not.toMatch(/\bundefined\b/i)
  expect(clone.textContent).not.toMatch(/\bNaN\b/)
}

beforeEach(() => {
  vi.restoreAllMocks()
})

describe("OrderConfirmationItems", () => {
  describe("B axis — renders the real fields", () => {
    it("renders the product name, quantity and unit price", () => {
      render(<OrderConfirmationItems orderResult={orderResult()} />)

      expect(screen.getByText("Composite Kit")).toBeInTheDocument()
      expect(screen.getByText("2")).toBeInTheDocument()
      expect(screen.getByText("$42.50")).toBeInTheDocument()
    })

    it("renders the item status badge", () => {
      render(<OrderConfirmationItems orderResult={orderResult({ orderItems: [baseItem({ status: "DELIVERED" })] })} />)

      expect(screen.getByText("DELIVERED")).toBeInTheDocument()
    })

    it("renders one card per order item, each keyed by its own id", () => {
      render(
        <OrderConfirmationItems
          orderResult={orderResult({
            orderItems: [
              baseItem({ id: "item-1", productName: "Composite Kit" }),
              baseItem({ id: "item-2", productName: "Curing Light" }),
            ],
          })}
        />,
      )

      expect(screen.getByText("Composite Kit")).toBeInTheDocument()
      expect(screen.getByText("Curing Light")).toBeInTheDocument()
    })

    it("renders shipping links when present", () => {
      render(
        <OrderConfirmationItems
          orderResult={orderResult({ orderItems: [baseItem({ shippingLink: ["https://ship.example/1"] })] })}
        />,
      )

      expect(screen.getByRole("link", { name: /Shipping Link 1/ })).toHaveAttribute("href", "https://ship.example/1")
    })

    it("renders tracking links when present", () => {
      render(
        <OrderConfirmationItems
          orderResult={orderResult({ orderItems: [baseItem({ trackingLink: ["https://track.example/1"] })] })}
        />,
      )

      expect(screen.getByRole("link", { name: /Tracking Link 1/ })).toHaveAttribute("href", "https://track.example/1")
    })

    it("does not render a shipping/tracking links section when there are none", () => {
      render(<OrderConfirmationItems orderResult={orderResult({ orderItems: [baseItem()] })} />)

      expect(screen.queryByText("Shipping Links")).not.toBeInTheDocument()
      expect(screen.queryByText("Tracking Links")).not.toBeInTheDocument()
    })

    it("renders nothing when the order has no items", () => {
      render(<OrderConfirmationItems orderResult={orderResult({ orderItems: [] })} />)

      expect(screen.queryByText("Order Items")).not.toBeInTheDocument()
    })
  })

  describe("C axis — hostile/malformed order item data", () => {
    it.each<{ name: string; orderItems: PlaceOrderResponse["orderItems"] }>([
      { name: "null instead of an array", orderItems: null as unknown as PlaceOrderResponse["orderItems"] },
      { name: "undefined instead of an array", orderItems: undefined as unknown as PlaceOrderResponse["orderItems"] },
      {
        name: "an object instead of an array",
        orderItems: { length: 1 } as unknown as PlaceOrderResponse["orderItems"],
      },
      { name: "a string instead of an array", orderItems: "oops" as unknown as PlaceOrderResponse["orderItems"] },
    ])("renders nothing instead of crashing when orderItems is $name", ({ orderItems }) => {
      expect(() => render(<OrderConfirmationItems orderResult={orderResult({ orderItems })} />)).not.toThrow()

      expect(screen.queryByText("Order Items")).not.toBeInTheDocument()
    })

    it("drops null entries within the order items array instead of crashing (backend OrderMapper.toOrderItemResponse can emit null)", () => {
      const orderItems = [null, baseItem({ id: "item-2", productName: "Curing Light" }), null] as unknown as OrderItem[]

      expect(() => render(<OrderConfirmationItems orderResult={orderResult({ orderItems })} />)).not.toThrow()

      expect(screen.getAllByText("Curing Light")).toHaveLength(1)
    })

    it("renders nothing instead of crashing when every order item is null", () => {
      const orderItems = [null, null] as unknown as OrderItem[]

      render(<OrderConfirmationItems orderResult={orderResult({ orderItems })} />)
      expect(screen.queryByText("Order Items")).not.toBeInTheDocument()
    })

    it.each<{ name: string; field: Partial<OrderItem> }>([
      { name: "productName missing", field: { productName: undefined } },
      { name: "productName null", field: { productName: null as unknown as string } },
      { name: "productCoverPhotoPath missing", field: { productCoverPhotoPath: undefined } },
      { name: "price null", field: { price: null as unknown as number } },
      { name: "price NaN", field: { price: Number.NaN } },
      { name: "price negative", field: { price: -25 } },
      { name: "quantity null", field: { quantity: null as unknown as number } },
      { name: "quantity zero", field: { quantity: 0 } },
      { name: "quantity negative", field: { quantity: -3 } },
      { name: "status missing", field: { status: undefined as unknown as string } },
      { name: "status null", field: { status: null as unknown as string } },
      { name: "shippingLink null", field: { shippingLink: null as unknown as string[] } },
      { name: "trackingLink null", field: { trackingLink: null as unknown as string[] } },
      // shippingLink/trackingLink arriving as a non-array (e.g. a bare string) is deliberately not
      // covered: OrderMapper always builds them as a real `List<String>` (`.stream()...collect(...)`
      // or `List.of()`), so Jackson can only ever serialize them as `null` or a JSON array — never a
      // scalar. Unlike `orderItems`/`savedCards`, there is no null-returning per-field mapper here.
    ])("does not crash and never prints raw null/undefined/NaN when $name", ({ field }) => {
      const item = baseItem(field)

      let container: HTMLElement | undefined
      expect(() => {
        ;({ container } = render(<OrderConfirmationItems orderResult={orderResult({ orderItems: [item] })} />))
      }).not.toThrow()

      expectNoRawNullText(container as HTMLElement)
    })

    it("falls back to a placeholder label when the product name is missing", () => {
      render(
        <OrderConfirmationItems orderResult={orderResult({ orderItems: [baseItem({ productName: undefined })] })} />,
      )

      expect(screen.getByText("Unnamed product")).toBeInTheDocument()
    })

    it("shows a broken/negative price through formatCurrency rather than a raw number or NaN", () => {
      render(<OrderConfirmationItems orderResult={orderResult({ orderItems: [baseItem({ price: Number.NaN })] })} />)

      expect(screen.getByText("$0.00")).toBeInTheDocument()
    })

    it("renders duplicate item ids without crashing", () => {
      const orderItems = [
        baseItem({ id: "dup", productName: "Composite Kit" }),
        baseItem({ id: "dup", productName: "Curing Light" }),
      ]

      expect(() => render(<OrderConfirmationItems orderResult={orderResult({ orderItems })} />)).not.toThrow()
    })

    it("renders an unusually long product name without crashing", () => {
      const longName = "Composite ".repeat(200)

      render(
        <OrderConfirmationItems orderResult={orderResult({ orderItems: [baseItem({ productName: longName })] })} />,
      )

      // RTL's default text normalizer trims surrounding whitespace before comparing, so the
      // matcher must be trimmed too even though the DOM node itself keeps the trailing space.
      expect(screen.getByText(longName.trim())).toBeInTheDocument()
    })

    it("does not render shipping/tracking link sections when the arrays are empty", () => {
      render(
        <OrderConfirmationItems
          orderResult={orderResult({ orderItems: [baseItem({ shippingLink: [], trackingLink: [] })] })}
        />,
      )

      expect(screen.queryByText("Shipping Links")).not.toBeInTheDocument()
      expect(screen.queryByText("Tracking Links")).not.toBeInTheDocument()
    })
  })
})
