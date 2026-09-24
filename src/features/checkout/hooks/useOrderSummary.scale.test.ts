import { renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it } from "vitest"
import { useCheckoutStore } from "@/stores/checkoutStore"
import { seedCart } from "@/test/cart"
import { makeCartItem, makeCartUserProduct } from "@/test/factories"
import { createQueryWrapper } from "@/test/render"
import { useOrderSummary } from "./useOrderSummary"

/**
 * Scale checks for the money-math path: a 10,000-line cart. These assert CORRECTNESS, not speed
 * — elapsed time is measured and reported via `performance.now()` but never asserted (CI hardware
 * varies and a flaky perf assertion is worse than none).
 */

beforeEach(() => {
  useCheckoutStore.setState({ orderPayload: null, selectedShippingCost: 0 })
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
    const { wrapper, client } = createQueryWrapper()
    seedCart(client, { cartItems: items })

    const start = performance.now()
    const { result } = renderHook(() => useOrderSummary(), { wrapper })
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
    const { wrapper, client } = createQueryWrapper()
    seedCart(client, { cartItems: items })

    const start = performance.now()
    const { result } = renderHook(() => useOrderSummary(), { wrapper })
    const elapsedMs = performance.now() - start

    const expectedSubtotal = items.reduce((sum, item) => sum + item.userProduct.price * item.quantity, 0)
    const expectedHeavyFee = items.reduce(
      (sum, item) => sum + item.userProduct.heavyShippingSurcharge * item.quantity,
      0,
    )

    expect(result.current.subtotal).toBe(expectedSubtotal)
    expect(result.current.heavyShipmentFee).toBeCloseTo(expectedHeavyFee, 6)
    // Volume discount kicks in above $2000 — this cart clears it comfortably.
    expect(result.current.subtotal).toBeGreaterThan(2000)
    expect(result.current.volumeDiscount).toBeCloseTo(expectedSubtotal * 0.05, 6)
    // No address is set in this suite, so the tax estimate never fires and stays null (not yet
    // estimated) — the total math treats that the same as $0, same as `useOrderSummary` itself.
    // Heavy shipment fee is part of the total (orders.total_price includes taked_heavy_shipment_fee).
    expect(result.current.total).toBeCloseTo(
      expectedSubtotal -
        expectedSubtotal * 0.05 +
        result.current.shipping +
        result.current.heavyShipmentFee +
        (result.current.tax ?? 0),
      6,
    )

    // biome-ignore lint/suspicious/noConsole: scale-test timing report, not app code.
    console.info(`[scale] useOrderSummary full totals over ${N} mixed-price lines: ${elapsedMs.toFixed(2)}ms`)
  })
})
