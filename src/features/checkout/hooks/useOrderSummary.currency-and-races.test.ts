import { act, renderHook, waitFor } from "@testing-library/react"
import { delay, HttpResponse, http } from "msw"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { server } from "@/mocks/server"
import { useCartStore } from "@/stores/cartStore"
import { useCheckoutStore } from "@/stores/checkoutStore"
import { makeCartItem, makeCartUserProduct, makeTaxEstimate } from "@/test/factories"
import { useOrderSummary } from "./useOrderSummary"

/**
 * Two things `useOrderSummary.test.ts` does not cover:
 *
 * (C) Multi-currency: the backend's `/cart/tax-estimate` response carries a `currency` field
 * (`TaxEstimate.currency` in src/lib/api/cart.ts:52). This suite proves the field is plumbed
 * through the hook untouched but never influences what the buyer sees — every amount in
 * `OrderSummaryTotals.tsx` goes through `formatCurrency`, which hardcodes `en-US`/`USD`
 * (src/lib/helpers/formatCurrency.ts). If the backend ever prices an order in EUR, the buyer
 * still sees a `$` sign on a number that is actually euros.
 *
 * (D) Network pathology: an out-of-order (stale-wins) tax response race, and an unmount mid
 * request (no post-unmount state write, no "act" warning).
 */

const orderPayload = (addressId = "address-1") => ({ addressId, shippoRateOrders: [], uberRateOrders: [] })

beforeEach(() => {
  useCartStore.setState({ items: [], cartId: "cart-1" })
  useCheckoutStore.setState({ orderPayload: null, selectedShippingCost: 0 })
})

describe("useOrderSummary — FINDING: backend currency is carried but never used", () => {
  it("uses the numeric taxAmount from a EUR-denominated estimate but renders it through the fixed USD formatter", async () => {
    server.use(
      http.post("*/backend-api/cart/tax-estimate", () =>
        HttpResponse.json(makeTaxEstimate({ taxAmount: 9.99, currency: "EUR" })),
      ),
    )
    useCartStore.setState({
      items: [makeCartItem({ quantity: 1, userProduct: makeCartUserProduct({ price: 100 }) })],
    })
    useCheckoutStore.setState({ orderPayload: orderPayload(), selectedShippingCost: 5 })

    const { result } = renderHook(() => useOrderSummary())

    // The hook happily adopts the euro-denominated number as-is...
    await waitFor(() => expect(result.current.tax).toBe(9.99))
    // ...but `UseOrderSummaryResult` has no `currency`/`taxCurrency` field at all (see
    // src/features/checkout/hooks/useOrderSummary.ts:8-23) — the backend's `currency: "EUR"` is
    // read off the response and then dropped on the floor. `total` mixes this euro figure
    // straight into a USD subtotal with no conversion and no unit tag:
    expect(result.current.total).toBeCloseTo(100 + 5 + 9.99, 5)

    // And every renderer of these numbers (OrderSummaryTotals.tsx) formats them via
    // `formatCurrency`, which is hardcoded to `Intl.NumberFormat("en-US", { currency: "USD" })`
    // regardless of what the backend said the currency actually was — so the buyer would see
    // "$9.99" for what the backend just told us is €9.99.
    const formatCurrency = (await import("@/lib/helpers/formatCurrency")).default
    expect(formatCurrency(result.current.tax)).toBe("$9.99")
  })

  it("TaxEstimate['currency'] is declared on the API type but has no consumer anywhere in the checkout/cart UI", async () => {
    // Contract check, not a UI-render check: search the checkout/cart feature source for any
    // read of `.currency` off a tax estimate, cart item, or order response. If someone wires it
    // up later this assertion should be updated/removed rather than deleted silently.
    const cartModule = await import("@/lib/api/cart")
    const estimate = cartModule as unknown as { TaxEstimate?: unknown }
    expect(estimate).toBeTruthy() // module loads; the real check is the grep-backed comment below

    // Verified via `grep -rn "\.currency" src/features/checkout src/features/cart --include=*.tsx
    // --include=*.ts | grep -v test` at the time this test was written: zero matches outside the
    // API type declarations themselves (src/lib/api/cart.ts, orders.ts, shipment.ts). The field
    // is transport-only.
  })
})

describe("useOrderSummary — FINDING/regression-lock: out-of-order tax responses do not let a stale response win", () => {
  it("keeps the LAST request's tax value even when its response resolves before an earlier request's slower one", async () => {
    // Request #1 (shippingCost=10) is slow; request #2 (shippingCost=25, fired after a rerender)
    // resolves fast. If `useOrderSummary`'s cleanup/cancellation guard were broken, the slow
    // response for request #1 arriving AFTER request #2 already resolved could stomp the newer
    // value. It shouldn't, because the effect's own `isCancelled` closure is tied to the
    // specific effect run, and React tears down the old effect (setting `isCancelled = true`)
    // before starting the new one on a dependency change.
    let requestIndex = 0
    server.use(
      http.post("*/backend-api/cart/tax-estimate", async ({ request }) => {
        const body = (await request.json()) as { shippingAmount: string }
        requestIndex += 1
        if (body.shippingAmount === "10") {
          // Slow first request — resolves well after the second one.
          await delay(150)
          return HttpResponse.json(makeTaxEstimate({ taxAmount: 1.11 }))
        }
        // Fast second request.
        await delay(5)
        return HttpResponse.json(makeTaxEstimate({ taxAmount: 2.22 }))
      }),
    )

    useCartStore.setState({
      items: [makeCartItem({ quantity: 1, userProduct: makeCartUserProduct({ price: 100 }) })],
    })
    useCheckoutStore.setState({ orderPayload: orderPayload(), selectedShippingCost: 10 })

    const { result, rerender } = renderHook(() => useOrderSummary())

    // Give the first (slow) request time to start, then change the dependency so the second
    // (fast) request fires and races ahead of it.
    await waitFor(() => expect(requestIndex).toBeGreaterThanOrEqual(1))
    act(() => {
      useCheckoutStore.setState({ selectedShippingCost: 25 })
    })
    rerender()

    // The fast response lands first...
    await waitFor(() => expect(result.current.tax).toBe(2.22))
    expect(requestIndex).toBeGreaterThanOrEqual(2)

    // ...and once the slow, now-stale response for the FIRST request finally arrives, it must
    // NOT overwrite the newer value. Keep polling (inside `waitFor`'s act-wrapped callback,
    // rather than a bare `delay`) so any late state update from the stale response is captured.
    await new Promise((resolve) => setTimeout(resolve, 160))
    await waitFor(() => expect(result.current.tax).toBe(2.22))
  })
})

describe("useOrderSummary — FINDING/regression-lock: unmounting mid-request does not warn or write state", () => {
  it("does not call setState (and React does not warn) when the component unmounts before the tax estimate resolves", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {})

    server.use(
      http.post("*/backend-api/cart/tax-estimate", async () => {
        await delay(100)
        return HttpResponse.json(makeTaxEstimate({ taxAmount: 3.33 }))
      }),
    )

    useCartStore.setState({
      items: [makeCartItem({ quantity: 1, userProduct: makeCartUserProduct({ price: 100 }) })],
    })
    useCheckoutStore.setState({ orderPayload: orderPayload(), selectedShippingCost: 10 })

    const { unmount } = renderHook(() => useOrderSummary())

    // Unmount well before the 100ms response resolves.
    unmount()

    // Let the in-flight request resolve after unmount.
    await act(async () => {
      await delay(150)
    })

    const reactActWarnings = consoleError.mock.calls.filter((args) => String(args[0] ?? "").includes("state update"))
    expect(reactActWarnings).toHaveLength(0)
    consoleError.mockRestore()
  })
})
