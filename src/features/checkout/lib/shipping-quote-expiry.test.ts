import { describe, expect, it, vi } from "vitest"
import { showToast } from "@/components/ui/Toast"
import {
  handleExpiredShippingQuote,
  isShippingQuoteExpired,
  SHIPPING_QUOTE_TTL_MS,
} from "@/features/checkout/lib/shipping-quote-expiry"
import { useCheckoutStore } from "@/stores/checkoutStore"

/**
 * `isShippingQuoteExpired` is the single source of truth for "has this quote gone stale" —
 * `useShippingDetails` (step 2 Continue), `useShippingQuoteExpiry` (the background timer) and
 * `useFinalReview.onPlaceOrder` (the synchronous guard) all call the same pure function so the
 * 10-minute rule can never drift between them.
 */
describe("isShippingQuoteExpired", () => {
  it("is not expired with no quote yet (null quotedAt)", () => {
    expect(isShippingQuoteExpired(null, Date.now())).toBe(false)
  })

  it("is not expired just under the 10-minute limit", () => {
    const quotedAt = 1_700_000_000_000
    const now = quotedAt + SHIPPING_QUOTE_TTL_MS - 1

    expect(isShippingQuoteExpired(quotedAt, now)).toBe(false)
  })

  it("is expired at exactly the 10-minute limit", () => {
    const quotedAt = 1_700_000_000_000
    const now = quotedAt + SHIPPING_QUOTE_TTL_MS

    expect(isShippingQuoteExpired(quotedAt, now)).toBe(true)
  })

  it("is expired well past the 10-minute limit", () => {
    const quotedAt = 1_700_000_000_000
    const now = quotedAt + SHIPPING_QUOTE_TTL_MS + 60_000

    expect(isShippingQuoteExpired(quotedAt, now)).toBe(true)
  })
})

describe("handleExpiredShippingQuote", () => {
  it("warns the buyer, clears the frozen shipping selection and sends them back to step 2", () => {
    const warningToast = vi.spyOn(showToast, "warning").mockImplementation(() => undefined)
    useCheckoutStore.setState({
      currentStep: 4,
      orderPayload: { addressId: "address-1", shippoRateOrders: [], uberRateOrders: [] },
      selectedShippingEtaText: "Ground - 5 business days",
      selectedShippingCost: 12.5,
      shippingQuoteFetchedAt: 1_700_000_000_000,
      // Untouched by clearShippingSelection - proves this only wipes the frozen shipping fields.
      poNumber: "PO-9001",
    })

    handleExpiredShippingQuote()

    expect(warningToast).toHaveBeenCalledWith(
      "Shipping rates expired",
      "Shipping prices can change. Please choose a shipping method again.",
    )
    expect(useCheckoutStore.getState().currentStep).toBe(2)
    expect(useCheckoutStore.getState().orderPayload).toBeNull()
    expect(useCheckoutStore.getState().selectedShippingEtaText).toBe("")
    expect(useCheckoutStore.getState().selectedShippingCost).toBe(0)
    expect(useCheckoutStore.getState().shippingQuoteFetchedAt).toBeNull()
    expect(useCheckoutStore.getState().poNumber).toBe("PO-9001")
  })
})
