"use client"

import { useRouter } from "next/navigation"
import { useEffect, useMemo, useRef } from "react"
import { refreshCart } from "@/features/cart/api/cart-queries"
import { useCartItems } from "@/features/cart/hooks/useCartQueries"
import { cartRequiresDentalLicense } from "@/features/cart/utils/license-check"
import { useCheckoutCartSync } from "@/features/checkout/hooks/useCheckoutCartSync"
import { useDentalLicenseGate } from "@/lib/hooks/useDentalLicenseGate"
import { useCheckoutStore } from "@/stores/checkoutStore"

type CheckoutView = "shipping" | "billing" | "review" | "confirmation" | "empty"

interface UseCheckoutPageResult {
  currentStep: 1 | 2 | 3 | 4 | 5
  showOrderSummary: boolean
  view: CheckoutView
}

export function useCheckoutPage(): UseCheckoutPageResult {
  const router = useRouter()
  // Fetch owner: a disabled reader tracks `cart.detail` while `refreshCart()` below owns the mount
  // fetch - same split as `useCartPage`.
  const items = useCartItems()
  const { currentStep, reset } = useCheckoutStore()
  const licenseGate = useDentalLicenseGate()

  useEffect(() => {
    void refreshCart()
  }, [])

  // A confirmation left by a previous order must not greet the next visit. OrderConfirmation does
  // not reset (that would trip the empty-cart guard below), so the store is cleared on entry instead.
  const initialStepRef = useRef(currentStep)
  useEffect(() => {
    if (initialStepRef.current === 5) reset()
  }, [reset])

  useEffect(() => {
    if (items.length === 0 && currentStep !== 5) {
      router.push("/cart")
    }
  }, [currentStep, items.length, router])

  // Guards a buyer who types /checkout directly, bypassing the cart page's click-time gate. Never
  // during confirmation or while the licence check is in flight (fail-closed on the SETTLED result).
  // `replace`, so the redirect leaves no checkout-then-cart history entry.
  useEffect(() => {
    if (currentStep === 5) return
    if (licenseGate.isChecking) return
    if (!cartRequiresDentalLicense(items)) return
    if (!licenseGate.checkFailed && licenseGate.status === "valid") return

    router.replace("/cart")
  }, [currentStep, items, licenseGate.isChecking, licenseGate.checkFailed, licenseGate.status, router])

  useCheckoutCartSync()

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
