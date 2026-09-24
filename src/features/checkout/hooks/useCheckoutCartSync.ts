"use client"

import { useEffect } from "react"
import { showToast } from "@/components/ui/Toast"
import { useCartItems } from "@/features/cart/hooks/useCartQueries"
import { getSellerGroupKey } from "@/features/checkout/utils/seller-group-key"
import { useCheckoutStore } from "@/stores/checkoutStore"

/**
 * Keeps checkout's frozen shipping state honest against the live cart. Guards two bugs:
 *
 * 1. A vendor removed from the cart (e.g. via "Edit Cart") stays forever in
 *    `selectedVendorShippingMethods`, so the order summary keeps showing a shipping line for a
 *    seller no longer being bought from.
 * 2. `orderPayload` is frozen once at the step 2→3 transition. If the buyer changes the cart
 *    behind checkout's back — browser back/forward to `/cart`, another tab — while sitting on
 *    step 3 or 4, the frozen payload can still reference removed lines or stale quantities. Since
 *    that payload (not the cart) is what gets sent to `POST /orders`, placing the order at that
 *    point would order the wrong thing.
 */
export function useCheckoutCartSync(): void {
  const items = useCartItems()
  const currentStep = useCheckoutStore((state) => state.currentStep)
  const orderPayload = useCheckoutStore((state) => state.orderPayload)
  const selectedVendorShippingMethods = useCheckoutStore((state) => state.selectedVendorShippingMethods)
  const setSelectedVendorShippingMethods = useCheckoutStore((state) => state.setSelectedVendorShippingMethods)
  const clearShippingSelection = useCheckoutStore((state) => state.clearShippingSelection)
  const setStep = useCheckoutStore((state) => state.setStep)
  const excludedFromOrder = useCheckoutStore((state) => state.excludedFromOrder)

  useEffect(() => {
    // Step 5: the cart has already been soft-deleted server-side once payment succeeds, so
    // `items` reads empty even though the order really did go through — the confirmation screen
    // still needs the frozen shipping map to render. An empty cart elsewhere is already handled
    // by `useCheckoutPage`'s redirect-to-/cart guard, so there is nothing to reconcile here either.
    if (currentStep === 5 || items.length === 0) return

    const liveKeys = new Set(items.map(getSellerGroupKey))
    const hasStaleVendor = Object.keys(selectedVendorShippingMethods).some((key) => !liveKeys.has(key))
    if (hasStaleVendor) {
      setSelectedVendorShippingMethods((prev) => {
        const next: typeof prev = {}
        for (const [key, value] of Object.entries(prev)) {
          if (liveKeys.has(key)) next[key] = value
        }
        return next
      })
    }

    if ((currentStep === 3 || currentStep === 4) && orderPayload) {
      const payloadLines = new Set(
        [...orderPayload.shippoRateOrders, ...orderPayload.uberRateOrders].flatMap((order) =>
          order.products.map((product) => `${product.userProductId}:${product.quantity}`),
        ),
      )
      // `useShippingDetails.onSubmit` only puts a seller's lines into the payload when that
      // seller has a selected rate; a seller whose rate lookup failed is recorded in
      // `excludedFromOrder` (sellerName + itemNames) instead, and its lines are deliberately left
      // out of `orderPayload` even though they are still sitting in the cart. Without accounting
      // for that, an excluded seller's lines would make `payloadLines`/`cartLines` mismatch on
      // every render and bounce the buyer back to step 2 in a loop. So: ignore cart lines that
      // belong to a seller which is both (a) not represented in the payload and (b) already
      // named in `excludedFromOrder` — everything else must still match the payload exactly,
      // including a brand-new seller that shows up in the cart with no payload lines and isn't
      // excluded (that's a real mismatch, not a known exclusion).
      const payloadIds = new Set(
        [...orderPayload.shippoRateOrders, ...orderPayload.uberRateOrders].flatMap((order) =>
          order.products.map((product) => product.userProductId),
        ),
      )
      const orderedSellerKeys = new Set(
        items.filter((item) => payloadIds.has(item.userProduct.userProductId)).map(getSellerGroupKey),
      )
      const excludedNames = new Set(excludedFromOrder.map((excluded) => excluded.sellerName))

      const cartLines = new Set(
        items
          .filter((item) => {
            const sellerKey = getSellerGroupKey(item)
            const sellerDisplayName = item.userProduct.sellerName || "Standard Seller"
            const isKnownExcluded = !orderedSellerKeys.has(sellerKey) && excludedNames.has(sellerDisplayName)
            return !isKnownExcluded
          })
          .map((item) => `${item.userProduct.userProductId}:${item.quantity}`),
      )

      const matches = payloadLines.size === cartLines.size && [...payloadLines].every((line) => cartLines.has(line))
      if (!matches) {
        clearShippingSelection()
        setStep(2)
        showToast.warning("Your cart changed", "Please review your shipping options.")
      }
    }
  }, [
    items,
    currentStep,
    orderPayload,
    selectedVendorShippingMethods,
    setSelectedVendorShippingMethods,
    clearShippingSelection,
    setStep,
    excludedFromOrder,
  ])
}
