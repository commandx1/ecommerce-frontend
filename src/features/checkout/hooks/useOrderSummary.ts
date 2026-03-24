"use client"

import { useMemo } from "react"
import { useCartStore } from "@/stores/cartStore"
import { useCheckoutStore } from "@/stores/checkoutStore"

interface UseOrderSummaryResult {
  applyTaxExemption: boolean
  currentStep: number
  selectedShippingEtaText: string
  shippingAddress: ReturnType<typeof useCheckoutStore.getState>["shippingAddress"]
  items: ReturnType<typeof useCartStore.getState>["items"]
  subtotal: number
  shipping: number
  tax: number
  taxExemption: number
  total: number
  volumeDiscount: number
}

export function useOrderSummary(): UseOrderSummaryResult {
  const { items } = useCartStore()
  const { shippingAddress, applyTaxExemption, currentStep, selectedShippingEtaText } = useCheckoutStore()

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + item.userProduct.price * item.quantity, 0)
  }, [items])

  const volumeDiscount = subtotal > 2000 ? subtotal * 0.05 : 0
  const shipping = subtotal > 1000 ? 0 : 50
  const tax = subtotal * 0.18
  const taxExemption = applyTaxExemption ? tax : 0
  const total = subtotal - volumeDiscount + shipping + tax - taxExemption

  return {
    applyTaxExemption,
    currentStep,
    selectedShippingEtaText,
    shippingAddress,
    items,
    subtotal,
    shipping,
    tax,
    taxExemption,
    total,
    volumeDiscount,
  }
}
