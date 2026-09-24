"use client"

import { useMemo } from "react"
import { useCartItems, useTaxEstimateQuery } from "@/features/cart/hooks/useCartQueries"
import type { CartItem } from "@/lib/api/cart"
import { useCheckoutStore } from "@/stores/checkoutStore"

interface UseOrderSummaryResult {
  currentStep: number
  selectedShippingEtaText: string
  selectedVendorShippingMethods: ReturnType<typeof useCheckoutStore.getState>["selectedVendorShippingMethods"]
  shippingAddress: ReturnType<typeof useCheckoutStore.getState>["shippingAddress"]
  items: CartItem[]
  subtotal: number
  shipping: number
  heavyShipmentFee: number
  hasSelectedShipping: boolean
  // null = not yet estimated (no address/items) or the estimate call failed — distinct from a
  // real $0 estimate the backend returned. Render this as "calculated at checkout", not $0.00.
  tax: number | null
  isTaxLoading: boolean
  total: number
  volumeDiscount: number
}

export function useOrderSummary(): UseOrderSummaryResult {
  const items = useCartItems()
  const {
    shippingAddress,
    currentStep,
    selectedShippingEtaText,
    selectedVendorShippingMethods,
    selectedShippingCost,
    orderPayload,
  } = useCheckoutStore()

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + item.userProduct.price * item.quantity, 0)
  }, [items])

  const volumeDiscount = subtotal > 2000 ? subtotal * 0.05 : 0
  const shipping = selectedShippingCost
  const heavyShipmentFee = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.userProduct.heavyShippingSurcharge ?? 0) * item.quantity, 0)
  }, [items])

  const hasSelectedShipping = Object.keys(selectedVendorShippingMethods).length > 0

  const addressId = orderPayload?.addressId ?? null
  // The backend counts heavy as shipping for tax purposes and does not add it itself, so we must
  // fold heavyShipmentFee into the shippingAmount we send.
  const shippingAmountForTax = shipping + heavyShipmentFee

  // `enabled`/finite/non-negative guards, the keepPreviousData behaviour and the malformed-200
  // (`Number.isFinite`) fallback all live in `useTaxEstimateQuery` now. `linesSignature` is kept
  // as `String(items.length)` — today's dependency, quantity changes at an equal line count don't
  // re-estimate (Phase 2 design doc §10.3, preserved deliberately; fixed separately later).
  const { tax, isTaxLoading } = useTaxEstimateQuery({
    addressId,
    shippingAmount: shippingAmountForTax,
    itemCount: items.length,
    linesSignature: String(items.length),
  })

  // The real charge is computed and collected server-side (OrderCreationService.computeTaxes),
  // so this total is a display-only estimate mirroring items + shipping + heavy + tax. Treating
  // an unknown tax as 0 here (rather than blocking the number entirely) matches that: the buyer
  // sees an untaxed subtotal+shipping+heavy total, and the UI below is responsible for making
  // clear that tax is still to be added.
  const total = subtotal - volumeDiscount + shipping + heavyShipmentFee + (tax ?? 0)

  return {
    currentStep,
    selectedShippingEtaText,
    selectedVendorShippingMethods,
    shippingAddress,
    items,
    subtotal,
    shipping,
    heavyShipmentFee,
    hasSelectedShipping,
    tax,
    isTaxLoading,
    total,
    volumeDiscount,
  }
}
