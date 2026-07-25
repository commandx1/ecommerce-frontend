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
  tax: number
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

  const [tax, setTax] = useState(0)
  const [isTaxLoading, setIsTaxLoading] = useState(false)

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + item.userProduct.price * item.quantity, 0)
  }, [items])

  const volumeDiscount = subtotal > 2000 ? subtotal * 0.05 : 0
  const shipping = selectedShippingCost
  const total = subtotal - volumeDiscount + shipping + tax

  const addressId = orderPayload?.addressId

  useEffect(() => {
    if (!addressId || items.length === 0) {
      setTax(0)
      setIsTaxLoading(false)
      return
    }

    let isCancelled = false
    const fetchTaxEstimate = async () => {
      setIsTaxLoading(true)
      try {
        const estimate = await cartAPI.getTaxEstimate({
          addressId,
          shippingAmount: String(shipping),
        })
        if (!isCancelled) {
          setTax(estimate.taxAmount)
        }
      } catch (_error) {
        if (!isCancelled) {
          setTax(0)
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
    tax,
    isTaxLoading,
    total,
    volumeDiscount,
  }
}
