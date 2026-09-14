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
  const bodies: { addressId: string; shippingAmount: number }[] = []
  server.use(
    http.post("*/backend-api/cart/tax-estimate", async ({ request }) => {
      bodies.push((await request.json()) as { addressId: string; shippingAmount: number })
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

  it("sums the heavy shipping surcharge across items", () => {
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

    expect(result.current.heavyShipmentFee).toBe(40)
  })

  it("treats a missing heavy surcharge field as zero rather than NaN", () => {
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

    expect(result.current.heavyShipmentFee).toBe(0)
  })

  it("has no selected shipping method until selectedVendorShippingMethods is populated", () => {
    const { result } = renderHook(() => useOrderSummary())

    expect(result.current.hasSelectedShipping).toBe(false)
  })

  it("reports a selected shipping method once selectedVendorShippingMethods is populated", () => {
    useCheckoutStore.setState({
      selectedVendorShippingMethods: {
        "seller-1": { sellerName: "Acme Dental", methodText: "Priority Mail - 2 business days", amount: 9.5 },
      },
    })

    const { result } = renderHook(() => useOrderSummary())

    expect(result.current.hasSelectedShipping).toBe(true)
  })

  it("adds the heavy surcharge into the total and folds it into the tax estimate's shippingAmount (total = subtotal - discount + shipping + heavy + tax)", async () => {
    const bodies = captureTaxRequests(1.5)
    useCartStore.setState({
      items: [
        makeCartItem({
          quantity: 1,
          userProduct: makeCartUserProduct({ price: 100, shipmentFee: 5, heavyShippingSurcharge: 20 }),
        }),
      ],
    })
    useCheckoutStore.setState({ orderPayload: orderPayload(), selectedShippingCost: 15 })

    const { result } = renderHook(() => useOrderSummary())

    await waitFor(() => expect(bodies).toHaveLength(1))
    await waitFor(() => expect(result.current.tax).toBe(1.5))
    expect(bodies).toEqual([{ addressId: "address-1", shippingAmount: 35 }])
    expect(result.current.total).toBeCloseTo(100 - 0 + 15 + 20 + 1.5, 5)
  })

  it("sends the heavy surcharge as shippingAmount and adds it to the total even before a shipping method is selected", async () => {
    const bodies = captureTaxRequests(0)
    useCartStore.setState({
      items: [
        makeCartItem({
          quantity: 1,
          userProduct: makeCartUserProduct({ price: 100, shipmentFee: 5, heavyShippingSurcharge: 20 }),
        }),
      ],
    })
    useCheckoutStore.setState({ orderPayload: orderPayload(), selectedShippingCost: 0 })

    const { result } = renderHook(() => useOrderSummary())

    await waitFor(() => expect(bodies).toHaveLength(1))
    expect(bodies).toEqual([{ addressId: "address-1", shippingAmount: 20 }])
    await waitFor(() => expect(result.current.tax).toBe(0))
    expect(result.current.total).toBeCloseTo(100 - 0 + 0 + 20 + 0, 5)
  })

  it("leaves tax unestimated (null) and never calls the backend without an address", async () => {
    const bodies = captureTaxRequests()
    useCartStore.setState({ items: [makeCartItem()] })

    const { result } = renderHook(() => useOrderSummary())

    await waitFor(() => expect(result.current.isTaxLoading).toBe(false))
    expect(result.current.tax).toBeNull()
    expect(bodies).toHaveLength(0)
  })

  it("does not estimate tax for an empty cart even with an address", async () => {
    const bodies = captureTaxRequests()
    useCheckoutStore.setState({ orderPayload: orderPayload() })

    const { result } = renderHook(() => useOrderSummary())

    await waitFor(() => expect(result.current.isTaxLoading).toBe(false))
    expect(bodies).toHaveLength(0)
    expect(result.current.tax).toBeNull()
  })

  it("estimates tax from the address and the selected shipping cost", async () => {
    const bodies = captureTaxRequests(12.34)
    useCartStore.setState({ items: [makeCartItem({ quantity: 1, userProduct: makeCartUserProduct({ price: 100 }) })] })
    useCheckoutStore.setState({ orderPayload: orderPayload(), selectedShippingCost: 15 })

    const { result } = renderHook(() => useOrderSummary())

    await waitFor(() => expect(result.current.tax).toBe(12.34))
    // Backend: CartTaxEstimateRequest.shippingAmount is a Double, not a string.
    expect(bodies).toEqual([{ addressId: "address-1", shippingAmount: 15 }])
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
    expect(bodies[1]).toEqual({ addressId: "address-1", shippingAmount: 25 })
  })

  // A malformed 200 can carry `taxAmount` as a non-number. Storing it would skip the
  // "Calculated at checkout" fallback and string-concatenate into the total, which
  // formatCurrency then floors to $0.00 - the buyer reads a wrong number either way.
  it.each([
    ["a string", "5"],
    ["null", null],
    ["an object", {}],
  ])("treats a non-numeric taxAmount (%s) as unestimated, not as a value", async (_label, taxAmount) => {
    useCartStore.setState({ items: [makeCartItem({ quantity: 1, userProduct: makeCartUserProduct({ price: 100 }) })] })
    useCheckoutStore.setState({ orderPayload: orderPayload(), selectedShippingCost: 15 })
    server.use(
      http.post("*/backend-api/cart/tax-estimate", () =>
        HttpResponse.json({ subtotal: 100, shippingAmount: 15, taxAmount, totalAmount: 115, currency: "usd" }),
      ),
    )

    const { result } = renderHook(() => useOrderSummary())

    await waitFor(() => expect(result.current.isTaxLoading).toBe(false))
    expect(result.current.tax).toBeNull()
    // The total stays a real number rather than a concatenated string.
    expect(result.current.total).toBeCloseTo(100 + 15, 5)
  })

  it("leaves tax unestimated (null), not zero, when the estimate call fails", async () => {
    server.use(http.post("*/backend-api/cart/tax-estimate", () => new HttpResponse(null, { status: 500 })))
    useCartStore.setState({ items: [makeCartItem({ quantity: 1, userProduct: makeCartUserProduct({ price: 100 }) })] })
    useCheckoutStore.setState({ orderPayload: orderPayload(), selectedShippingCost: 5 })

    const { result } = renderHook(() => useOrderSummary())

    await waitFor(() => expect(result.current.isTaxLoading).toBe(false))
    // Not 0 — a real $0 estimate and "we couldn't estimate it" must stay distinguishable so the
    // UI can show "calculated at checkout" instead of a misleading $0.00 tax line.
    expect(result.current.tax).toBeNull()
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
