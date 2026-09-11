"use client"

import { useRouter } from "next/navigation"
import { useEffect, useMemo } from "react"
import { cartRequiresDentalLicense } from "@/features/cart/utils/license-check"
import { useCheckoutCartSync } from "@/features/checkout/hooks/useCheckoutCartSync"
import { useDentalLicenseGate } from "@/lib/hooks/useDentalLicenseGate"
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
  const licenseGate = useDentalLicenseGate()

  useEffect(() => {
    void fetchCart()
  }, [fetchCart])

  useEffect(() => {
    if (items.length === 0 && currentStep !== 5) {
      router.push("/cart")
    }
  }, [currentStep, items.length, router])

  // Guards a buyer who types /checkout directly (or refreshes mid-flow), bypassing the cart
  // page's click-time gate entirely. Mirrors the empty-cart guard above: never during the
  // confirmation step, and never while the licence check is still in flight (isChecking) — the
  // gate is fail-closed on the SETTLED result, not on the pre-fetch default. Uses `replace`
  // (not `push`) so this guard redirect doesn't leave a checkout-then-cart entry in history.
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
