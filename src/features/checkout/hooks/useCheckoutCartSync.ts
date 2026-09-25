"use client"

import { useEffect } from "react"
import { showToast } from "@/components/ui/Toast"
import { useCartItems } from "@/features/cart/hooks/useCartQueries"
import { getSellerGroupKey } from "@/features/checkout/utils/seller-group-key"
import { useCheckoutStore } from "@/stores/checkoutStore"

/**
 * Keeps checkout's frozen shipping state honest against the live cart:
 * 1. a vendor removed from the cart must not keep a shipping line in `selectedVendorShippingMethods`;
 * 2. `orderPayload` is frozen at the step 2→3 transition, and it (not the cart) is what `POST /orders`
 *    sends - a cart changed behind checkout's back (back/forward, another tab) must not be ordered stale.
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
      // A seller whose rate lookup failed is recorded in `excludedFromOrder` and its lines are left
      // out of the payload while still in the cart. Ignore those lines (seller absent from the payload
      // AND named in `excludedFromOrder`), or the mismatch would bounce the buyer back to step 2 in a
      // loop; everything else, including a brand-new seller, must match the payload exactly.
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
