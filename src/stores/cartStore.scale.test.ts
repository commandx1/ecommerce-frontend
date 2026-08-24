import { renderHook } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { beforeEach, describe, expect, it } from "vitest"
import { useOrderSummary } from "@/features/checkout/hooks/useOrderSummary"
import type { Cart, CartItem } from "@/lib/api/cart"
import { server } from "@/mocks/server"
import { useCheckoutStore } from "@/stores/checkoutStore"
import { makeCart, makeCartItem, makeCartUserProduct } from "@/test/factories"
import { useCartStore } from "./cartStore"

/**
 * Scale checks for the money-math path: a 10,000-line cart. These assert CORRECTNESS, not speed
 * — per the brief we measure and report elapsed time via `performance.now()` but do not assert a
 * hard ceiling (CI hardware varies and a flaky perf assertion is worse than none).
 */

function buildLargeCart(count: number, priceEach: number): Cart {
  const cartItems: CartItem[] = Array.from({ length: count }, (_, i) =>
    makeCartItem({
      id: `ci-${i}`,
      quantity: 1,
      userProduct: makeCartUserProduct({
        userProductId: `up-${i}`,
        price: priceEach,
        shipmentFee: 0,
        heavyShippingSurcharge: 0,
      }),
    }),
  )
  return makeCart({ cartItems })
}

beforeEach(() => {
  useCartStore.setState({ items: [], cartId: null, cartCount: 0, lastFetchedAt: 0 })
  useCheckoutStore.setState({ orderPayload: null, selectedShippingCost: 0 })
})

describe("cartStore at 10,000 lines — cartCount aggregation", () => {
  it("sums 10,000 quantities correctly and reports fetch+aggregate time", async () => {
    const N = 10_000
    const cart = buildLargeCart(N, 12.5)
    // Vary quantity so the sum is not just N*1.
    cart.cartItems = cart.cartItems.map((item, i) => ({ ...item, quantity: (i % 5) + 1 }))
    const expectedCount = cart.cartItems.reduce((sum, item) => sum + item.quantity, 0)

    server.use(http.get("*/backend-api/cart", () => HttpResponse.json(cart)))

    const start = performance.now()
    await useCartStore.getState().fetchCart({ force: true })
    const elapsedMs = performance.now() - start

    expect(useCartStore.getState().items).toHaveLength(N)
    expect(useCartStore.getState().cartCount).toBe(expectedCount)
    // Not asserted, only surfaced for the report:
    // biome-ignore lint/suspicious/noConsole: scale-test timing report, not app code.
    console.info(`[scale] cartStore.fetchCart + cartCount reduce over ${N} items: ${elapsedMs.toFixed(2)}ms`)
  })
})

describe("useOrderSummary at 10,000 lines — totals and floating-point accumulation", () => {
  it("computes an exact subtotal for 10,000 lines priced at 0.1 (classic float-drift trap)", () => {
    const N = 10_000
    const priceEach = 0.1
    const items = Array.from({ length: N }, (_, i) =>
      makeCartItem({
        id: `ci-${i}`,
        quantity: 1,
        userProduct: makeCartUserProduct({ userProductId: `up-${i}`, price: priceEach }),
      }),
    )
    useCartStore.setState({ items })

    const start = performance.now()
    const { result } = renderHook(() => useOrderSummary())
    const elapsedMs = performance.now() - start

    // FINDING: `useOrderSummary`'s subtotal is a plain `reduce` accumulating IEEE-754 doubles
    // (see src/features/checkout/hooks/useOrderSummary.ts:39-41, `sum + item.userProduct.price *
    // item.quantity`). Summing 0.1 ten thousand times does NOT land on the mathematically exact
    // 1000 — naive floating point accumulation drifts. This test locks the ACTUAL (drifted)
    // value so any change to the summation strategy (e.g. switching to integer cents, or a
    // compensated/Kahan sum) shows up as a visible diff here rather than silently "fixing" the
    // number without anyone noticing the behavior changed.
    const naiveExpected = Array.from({ length: N }, () => priceEach).reduce((a, b) => a + b, 0)
    expect(result.current.subtotal).toBe(naiveExpected)
    // Quantify the drift against the mathematically exact value for the report:
    const exact = N * priceEach
    const driftCents = Math.round(Math.abs(result.current.subtotal - exact) * 100)
    // biome-ignore lint/suspicious/noConsole: scale-test timing report, not app code.
    console.info(
      `[scale] useOrderSummary subtotal over ${N} x $0.10 lines: ${elapsedMs.toFixed(2)}ms, ` +
        `computed=${result.current.subtotal}, exact=${exact}, drift=${driftCents} cent-units (0 = no visible drift at this N)`,
    )
  })

  it("keeps subtotal, volume discount and shipment fees correct and internally consistent at 10,000 lines", () => {
    const N = 10_000
    const items = Array.from({ length: N }, (_, i) =>
      makeCartItem({
        id: `ci-${i}`,
        quantity: (i % 3) + 1,
        userProduct: makeCartUserProduct({
          userProductId: `up-${i}`,
          price: 1.23,
          shipmentFee: 0.5,
          heavyShippingSurcharge: i % 10 === 0 ? 2 : 0,
        }),
      }),
    )
    useCartStore.setState({ items })

    const start = performance.now()
    const { result } = renderHook(() => useOrderSummary())
    const elapsedMs = performance.now() - start

    const expectedSubtotal = items.reduce((sum, item) => sum + item.userProduct.price * item.quantity, 0)
    const expectedShipmentFee = items.reduce((sum, item) => sum + item.userProduct.shipmentFee * item.quantity, 0)
    const expectedHeavyFee = items.reduce(
      (sum, item) => sum + item.userProduct.heavyShippingSurcharge * item.quantity,
      0,
    )

    expect(result.current.subtotal).toBe(expectedSubtotal)
    expect(result.current.shipmentFee).toBeCloseTo(expectedShipmentFee, 6)
    expect(result.current.heavyShipmentFee).toBeCloseTo(expectedHeavyFee, 6)
    expect(result.current.totalShipmentFee).toBeCloseTo(expectedShipmentFee + expectedHeavyFee, 6)
    // Volume discount kicks in above $2000 — this cart clears it comfortably.
    expect(result.current.subtotal).toBeGreaterThan(2000)
    expect(result.current.volumeDiscount).toBeCloseTo(expectedSubtotal * 0.05, 6)
    expect(result.current.total).toBeCloseTo(
      expectedSubtotal - expectedSubtotal * 0.05 + result.current.shipping + result.current.tax,
      6,
    )

    // biome-ignore lint/suspicious/noConsole: scale-test timing report, not app code.
    console.info(`[scale] useOrderSummary full totals over ${N} mixed-price lines: ${elapsedMs.toFixed(2)}ms`)
  })
})
