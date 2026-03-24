"use client"

import { useRouter } from "next/navigation"
import { useEffect, useMemo } from "react"
import { useCartStore } from "@/stores/cartStore"
import { useCheckoutStore } from "@/stores/checkoutStore"

type CheckoutView = "shipping" | "billing" | "review" | "confirmation" | "empty"

interface UseCheckoutPageResult {
  currentStep: 1 | 2 | 3 | 4 | 5
  showOrderSummary: boolean
  view: CheckoutView
}

export function useCheckoutPage(): UseCheckoutPageResult {
  const router = useRouter()
  const { items, fetchCart } = useCartStore()
  const { currentStep } = useCheckoutStore()

  useEffect(() => {
    void fetchCart()
  }, [fetchCart])

  useEffect(() => {
    if (items.length === 0 && currentStep !== 5) {
      router.push("/cart")
    }
  }, [currentStep, items.length, router])

  const view = useMemo<CheckoutView>(() => {
    if (currentStep === 2) return "shipping"
    if (currentStep === 3) return "billing"
    if (currentStep === 4) return "review"
    if (currentStep === 5) return "confirmation"
    return "empty"
  }, [currentStep])

  return {
    currentStep,
    showOrderSummary: currentStep !== 5,
    view,
  }
}
