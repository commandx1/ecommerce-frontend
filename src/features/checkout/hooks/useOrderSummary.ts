"use client"

import { useEffect, useMemo, useState } from "react"
import { cartAPI } from "@/lib/api/cart"
import { useCartStore } from "@/stores/cartStore"
import { useCheckoutStore } from "@/stores/checkoutStore"

interface UseOrderSummaryResult {
  currentStep: number
  selectedShippingEtaText: string
  selectedVendorShippingMethods: ReturnType<typeof useCheckoutStore.getState>["selectedVendorShippingMethods"]
  shippingAddress: ReturnType<typeof useCheckoutStore.getState>["shippingAddress"]
  items: ReturnType<typeof useCartStore.getState>["items"]
  subtotal: number
  shipping: number
  shipmentFee: number
  heavyShipmentFee: number
  totalShipmentFee: number
  // null = not yet estimated (no address/items) or the estimate call failed — distinct from a
  // real $0 estimate the backend returned. Render this as "calculated at checkout", not $0.00.
  tax: number | null
  isTaxLoading: boolean
  total: number
  volumeDiscount: number
}

export function useOrderSummary(): UseOrderSummaryResult {
  const { items } = useCartStore()
  const {
    shippingAddress,
    currentStep,
    selectedShippingEtaText,
    selectedVendorShippingMethods,
    selectedShippingCost,
    orderPayload,
  } = useCheckoutStore()

  const [tax, setTax] = useState<number | null>(null)
  const [isTaxLoading, setIsTaxLoading] = useState(false)

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + item.userProduct.price * item.quantity, 0)
  }, [items])

  const volumeDiscount = subtotal > 2000 ? subtotal * 0.05 : 0
  const shipping = selectedShippingCost
  // The real charge is computed and collected server-side (OrderCreationService.computeTaxes),
  // so this total is a display-only estimate. Treating an unknown tax as 0 here (rather than
  // blocking the number entirely) matches that: the buyer sees an untaxed subtotal+shipping
  // total, and the UI below is responsible for making clear that tax is still to be added.
  const total = subtotal - volumeDiscount + shipping + (tax ?? 0)

  const shipmentFee = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.userProduct.shipmentFee ?? 0) * item.quantity, 0)
  }, [items])
  const heavyShipmentFee = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.userProduct.heavyShippingSurcharge ?? 0) * item.quantity, 0)
  }, [items])
  const totalShipmentFee = shipmentFee + heavyShipmentFee

  const addressId = orderPayload?.addressId

  useEffect(() => {
    if (!addressId || items.length === 0) {
      setTax(null)
      setIsTaxLoading(false)
      return
    }

    // Backend: CartTaxEstimateRequest.shippingAmount is a Double (@NotNull @PositiveOrZero) — an
    // unserializable shipping figure (NaN/Infinity) or a negative one can never be estimated, so
    // skip the request instead of sending a value the backend would 400 on.
    if (!Number.isFinite(shipping) || shipping < 0) {
      setTax(null)
      setIsTaxLoading(false)
      return
    }

    let isCancelled = false
    const fetchTaxEstimate = async () => {
      setIsTaxLoading(true)
      try {
        const estimate = await cartAPI.getTaxEstimate({
          addressId,
          shippingAmount: shipping,
        })
        if (!isCancelled) {
          // The estimate is money the buyer reads: a non-numeric `taxAmount` from a malformed 200
          // must fall through to "Calculated at checkout" rather than being stored, where it would
          // string-concatenate into the total (100 + 5 + "5" -> "1055") and then be floored to
          // $0.00 by formatCurrency (infra note #26, numeric form).
          setTax(Number.isFinite(estimate.taxAmount) ? estimate.taxAmount : null)
        }
      } catch (_error) {
        if (!isCancelled) {
          setTax(null)
        }
      } finally {
        if (!isCancelled) {
          setIsTaxLoading(false)
        }
      }
    }

    void fetchTaxEstimate()

    return () => {
      isCancelled = true
    }
  }, [addressId, items.length, shipping])

  return {
    currentStep,
    selectedShippingEtaText,
    selectedVendorShippingMethods,
    shippingAddress,
    items,
    subtotal,
    shipping,
    shipmentFee,
    heavyShipmentFee,
    totalShipmentFee,
    tax,
    isTaxLoading,
    total,
    volumeDiscount,
  }
}
