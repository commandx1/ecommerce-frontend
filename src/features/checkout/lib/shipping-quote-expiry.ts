import { showToast } from "@/components/ui/Toast"
import { useCheckoutStore } from "@/stores/checkoutStore"

/**
 * A shipping quote (the vendor rates the buyer selected in step 2) is only trustworthy for this
 * long after it was FETCHED — an auto-selected cheapest rate counts, and with multiple vendors the
 * quote's age is the oldest fetch among the currently selected vendors' rates. Past this, the
 * carrier's price can have moved, so the buyer must re-select against fresh rates.
 */
export const SHIPPING_QUOTE_TTL_MS = 10 * 60 * 1000

/**
 * Pure. `quotedAt` is the oldest `fetchedAt` among the currently selected vendors' rates (see
 * `useShippingDetails`), or `null` when no quote has been taken yet — nothing to expire.
 */
export function isShippingQuoteExpired(quotedAt: number | null, now: number): boolean {
  if (quotedAt === null) return false
  return now - quotedAt >= SHIPPING_QUOTE_TTL_MS
}

/**
 * Bounces the buyer back to the shipping-methods step when their quote has gone stale: clears the
 * frozen shipping selection (so step 2 re-fetches and auto-selects the cheapest rate again, see
 * `VendorShipmentRates`/`useShippingDetails`) and tells them why. Called from both
 * `useShippingQuoteExpiry` (the background timer) and `useFinalReview.onPlaceOrder` (a synchronous
 * guard right before a charge would otherwise be attempted) — kept here once so neither duplicates
 * the other's side effects.
 */
export function handleExpiredShippingQuote(): void {
  showToast.warning("Shipping rates expired", "Shipping prices can change. Please choose a shipping method again.")
  const { clearShippingSelection, setStep } = useCheckoutStore.getState()
  clearShippingSelection()
  setStep(2)
}
