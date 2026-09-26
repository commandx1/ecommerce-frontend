"use client"

import { useEffect } from "react"
import {
  handleExpiredShippingQuote,
  isShippingQuoteExpired,
  SHIPPING_QUOTE_TTL_MS,
} from "@/features/checkout/lib/shipping-quote-expiry"
import { useCheckoutStore } from "@/stores/checkoutStore"

/**
 * Owns the single timer that expires a step-2 shipping quote once the buyer has moved on to
 * billing or review (steps 3-4). A quote is only trustworthy for `SHIPPING_QUOTE_TTL_MS` after it
 * was fetched — past that, carrier prices can have moved, so the buyer is bounced back to step 2
 * to re-select against fresh rates (`handleExpiredShippingQuote`).
 *
 * Scheduled with the exact remaining time (not a poll) so it fires the instant the quote goes
 * stale in an open tab, and re-checked on `focus`/`visibilitychange` because a background tab's
 * timers are throttled or fully suspended and can miss that moment entirely.
 *
 * Deliberately does nothing while `useFinalReview` has a submission in flight (that hook takes its
 * own synchronous expiry check right before charging, see `useFinalReview.onPlaceOrder`) or
 * outside steps 3-4 (never on step 5 — the order is already placed).
 */
export function useShippingQuoteExpiry(): void {
  const currentStep = useCheckoutStore((state) => state.currentStep)
  const shippingQuoteFetchedAt = useCheckoutStore((state) => state.shippingQuoteFetchedAt)
  const isPlacingOrder = useCheckoutStore((state) => state.isPlacingOrder)

  useEffect(() => {
    if (currentStep !== 3 && currentStep !== 4) return
    if (shippingQuoteFetchedAt === null) return
    if (isPlacingOrder) return

    const checkExpiry = () => {
      if (!isShippingQuoteExpired(shippingQuoteFetchedAt, Date.now())) return
      handleExpiredShippingQuote()
    }

    const remainingMs = Math.max(SHIPPING_QUOTE_TTL_MS - (Date.now() - shippingQuoteFetchedAt), 0)
    const timeoutId = window.setTimeout(checkExpiry, remainingMs)
    window.addEventListener("focus", checkExpiry)
    document.addEventListener("visibilitychange", checkExpiry)

    return () => {
      window.clearTimeout(timeoutId)
      window.removeEventListener("focus", checkExpiry)
      document.removeEventListener("visibilitychange", checkExpiry)
    }
  }, [currentStep, shippingQuoteFetchedAt, isPlacingOrder])
}
