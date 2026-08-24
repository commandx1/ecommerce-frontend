import { act, renderHook, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { beforeEach, describe, expect, it } from "vitest"
import type { PlaceOrderPayload } from "@/lib/api/orders"
import { server } from "@/mocks/server"
import { useCartStore } from "@/stores/cartStore"
import { useCheckoutStore } from "@/stores/checkoutStore"
import { makeCartItem, makeCartUserProduct, makeTaxEstimate } from "@/test/factories"
import { useOrderSummary } from "./useOrderSummary"

/**
 * `useOrderSummary` is the money panel. Every number the buyer sees before they authorise a
 * charge is computed here, and the tax figure is the only one that comes from the backend.
 */

const orderPayload = (overrides: Partial<PlaceOrderPayload> = {}): PlaceOrderPayload => ({
  addressId: "address-1",
  shippoRateOrders: [],
  uberRateOrders: [],
  ...overrides,
})

/** Registers the tax handler and returns the bodies it received, so refetches stay observable. */
const captureTaxRequests = (taxAmount = 8.5) => {
  const bodies: { addressId: string; shippingAmount: string }[] = []
  server.use(
    http.post("*/backend-api/cart/tax-estimate", async ({ request }) => {
      bodies.push((await request.json()) as { addressId: string; shippingAmount: string })
      return HttpResponse.json(makeTaxEstimate({ taxAmount }))
    }),
  )
  return bodies
}

beforeEach(() => {
  useCartStore.setState({ items: [], cartId: "cart-1" })
})

describe("useOrderSummary", () => {
  it("sums the line prices into the subtotal", () => {
    useCartStore.setState({
      items: [
        makeCartItem({ id: "a", quantity: 2, userProduct: makeCartUserProduct({ price: 50 }) }),
        makeCartItem({ id: "b", quantity: 3, userProduct: makeCartUserProduct({ price: 10 }) }),
      ],
    })

    const { result } = renderHook(() => useOrderSummary())

    expect(result.current.subtotal).toBe(130)
  })

  it("gives no volume discount at or below the $2000 threshold", () => {
    useCartStore.setState({
      items: [makeCartItem({ quantity: 1, userProduct: makeCartUserProduct({ price: 2000 }) })],
    })

    const { result } = renderHook(() => useOrderSummary())

    expect(result.current.volumeDiscount).toBe(0)
  })

  it("applies a 5% volume discount above $2000", () => {
    useCartStore.setState({
      items: [makeCartItem({ quantity: 1, userProduct: makeCartUserProduct({ price: 2400 }) })],
    })

    const { result } = renderHook(() => useOrderSummary())

    expect(result.current.volumeDiscount).toBe(120)
  })

  it("splits the shipment fees into base, heavy and total", () => {
    useCartStore.setState({
      items: [
        makeCartItem({
          id: "a",
          quantity: 2,
          userProduct: makeCartUserProduct({ price: 10, shipmentFee: 5, heavyShippingSurcharge: 20 }),
        }),
        makeCartItem({
          id: "b",
          quantity: 1,
          userProduct: makeCartUserProduct({ price: 10, shipmentFee: 3, heavyShippingSurcharge: 0 }),
        }),
      ],
    })

    const { result } = renderHook(() => useOrderSummary())

    expect(result.current.shipmentFee).toBe(13)
    expect(result.current.heavyShipmentFee).toBe(40)
    expect(result.current.totalShipmentFee).toBe(53)
  })

  it("treats missing fee fields as zero rather than NaN", () => {
    useCartStore.setState({
      items: [
        makeCartItem({
          quantity: 2,
          userProduct: makeCartUserProduct({
            price: 10,
            shipmentFee: undefined as unknown as number,
            heavyShippingSurcharge: undefined as unknown as number,
          }),
        }),
      ],
    })

    const { result } = renderHook(() => useOrderSummary())

    expect(result.current.totalShipmentFee).toBe(0)
  })

  it("keeps tax at zero and never calls the backend without an address", async () => {
    const bodies = captureTaxRequests()
    useCartStore.setState({ items: [makeCartItem()] })

    const { result } = renderHook(() => useOrderSummary())

    await waitFor(() => expect(result.current.isTaxLoading).toBe(false))
    expect(result.current.tax).toBe(0)
    expect(bodies).toHaveLength(0)
  })

  it("does not estimate tax for an empty cart even with an address", async () => {
    const bodies = captureTaxRequests()
    useCheckoutStore.setState({ orderPayload: orderPayload() })

    const { result } = renderHook(() => useOrderSummary())

    await waitFor(() => expect(result.current.isTaxLoading).toBe(false))
    expect(bodies).toHaveLength(0)
    expect(result.current.tax).toBe(0)
  })

  it("estimates tax from the address and the selected shipping cost", async () => {
    const bodies = captureTaxRequests(12.34)
    useCartStore.setState({ items: [makeCartItem({ quantity: 1, userProduct: makeCartUserProduct({ price: 100 }) })] })
    useCheckoutStore.setState({ orderPayload: orderPayload(), selectedShippingCost: 15 })

    const { result } = renderHook(() => useOrderSummary())

    await waitFor(() => expect(result.current.tax).toBe(12.34))
    expect(bodies).toEqual([{ addressId: "address-1", shippingAmount: "15" }])
    // total = subtotal - volume discount + shipping + tax
    expect(result.current.total).toBeCloseTo(100 - 0 + 15 + 12.34, 5)
  })

  it("re-estimates tax when the shipping cost changes, so a stale tax is never charged", async () => {
    const bodies = captureTaxRequests()
    useCartStore.setState({ items: [makeCartItem()] })
    useCheckoutStore.setState({ orderPayload: orderPayload(), selectedShippingCost: 10 })

    const { rerender } = renderHook(() => useOrderSummary())
    await waitFor(() => expect(bodies).toHaveLength(1))

    act(() => {
      useCheckoutStore.setState({ selectedShippingCost: 25 })
    })
    rerender()

    await waitFor(() => expect(bodies).toHaveLength(2))
    expect(bodies[1]).toEqual({ addressId: "address-1", shippingAmount: "25" })
  })

  it("falls back to zero tax when the estimate call fails", async () => {
    server.use(http.post("*/backend-api/cart/tax-estimate", () => new HttpResponse(null, { status: 500 })))
    useCartStore.setState({ items: [makeCartItem({ quantity: 1, userProduct: makeCartUserProduct({ price: 100 }) })] })
    useCheckoutStore.setState({ orderPayload: orderPayload(), selectedShippingCost: 5 })

    const { result } = renderHook(() => useOrderSummary())

    await waitFor(() => expect(result.current.isTaxLoading).toBe(false))
    expect(result.current.tax).toBe(0)
    // The buyer is still shown a total, just an untaxed one — the charge itself is computed
    // server side, so this is a display-only optimism.
    expect(result.current.total).toBe(105)
  })

  it("passes the checkout step, ETA text and per-vendor methods straight through", () => {
    useCheckoutStore.setState({
      currentStep: 4,
      selectedShippingEtaText: "Priority Mail - 2 business days",
      selectedVendorShippingMethods: {
        "seller-1": { sellerName: "Acme Dental", methodText: "Priority Mail - 2 business days", amount: 9.5 },
      },
      // Set explicitly: the store's initial address is empty by design (see K1), so a
      // pass-through assertion has to supply the value it expects to come back out.
      shippingAddress: { ...useCheckoutStore.getState().shippingAddress, city: "San Francisco" },
    })

    const { result } = renderHook(() => useOrderSummary())

    expect(result.current.currentStep).toBe(4)
    expect(result.current.selectedShippingEtaText).toBe("Priority Mail - 2 business days")
    expect(result.current.selectedVendorShippingMethods["seller-1"].amount).toBe(9.5)
    expect(result.current.shippingAddress.city).toBe("San Francisco")
  })
})
