"use client"

import { useRouter } from "next/navigation"
import { useEffect, useMemo, useRef } from "react"
import { refreshCart } from "@/features/cart/api/cart-queries"
import { useCartItems } from "@/features/cart/hooks/useCartQueries"
import { cartRequiresDentalLicense } from "@/features/cart/utils/license-check"
import { useCheckoutCartSync } from "@/features/checkout/hooks/useCheckoutCartSync"
import type { DentalLicenseStatus } from "@/lib/helpers/dentalLicense"
import { useDentalLicenseGate } from "@/lib/hooks/useDentalLicenseGate"
import { useCheckoutStore } from "@/stores/checkoutStore"

type CheckoutView = "shipping" | "billing" | "review" | "confirmation" | "empty"

export interface CheckoutLicenseWarning {
  licenseCheckFailed: boolean
  licenseStatus: DentalLicenseStatus | null
  licenseRejectionReason: string | null
}

interface UseCheckoutPageResult {
  currentStep: 1 | 2 | 3 | 4 | 5
  showOrderSummary: boolean
  view: CheckoutView
  /**
   * Set only for a mount that resets a stale step-5 confirmation (see below) into an invalid
   * license: the buyer stays on the "empty" view instead of being bounced to /cart, and this
   * carries what that view needs to show the same license warning `/cart` would have shown.
   */
  licenseWarning: CheckoutLicenseWarning | null
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
  const isStaleConfirmationReset = initialStepRef.current === 5
  useEffect(() => {
    if (isStaleConfirmationReset) reset()
  }, [isStaleConfirmationReset, reset])

  useEffect(() => {
    if (items.length === 0 && currentStep !== 5) {
      router.push("/cart")
    }
  }, [currentStep, items.length, router])

  const requiresLicense = cartRequiresDentalLicense(items)
  const isLicenseSettledInvalid = !licenseGate.isChecking && (licenseGate.checkFailed || licenseGate.status !== "valid")

  // Guards a buyer who types /checkout directly, bypassing the cart page's click-time gate. Never
  // during confirmation or while the licence check is in flight (fail-closed on the SETTLED result).
  // `replace`, so the redirect leaves no checkout-then-cart history entry.
  useEffect(() => {
    if (currentStep === 5) return
    if (!requiresLicense) return
    if (!isLicenseSettledInvalid) return
    // The reset above (stale step-5 confirmation) just moved this same mount from 5 to 1 - that
    // internal transition is not a buyer typing /checkout with no valid license, and bouncing them
    // to /cart here would just swap one confusing screen for another. Keep them in checkout; the
    // license warning below covers the same ground /cart's gate would have.
    if (isStaleConfirmationReset) return

    router.replace("/cart")
  }, [currentStep, requiresLicense, isLicenseSettledInvalid, isStaleConfirmationReset, router])

  useCheckoutCartSync()

  const view = useMemo<CheckoutView>(() => {
    if (currentStep === 2) return "shipping"
    if (currentStep === 3) return "billing"
    if (currentStep === 4) return "review"
    if (currentStep === 5) return "confirmation"
    return "empty"
  }, [currentStep])

  // Only ever populated on the "empty" view reached by the stale-confirmation reset above (a
  // normal fresh checkout never cold-mounts at step 1) - everywhere else this is null and the
  // view renders exactly as it did before.
  const licenseWarning: CheckoutLicenseWarning | null =
    isStaleConfirmationReset && currentStep === 1 && requiresLicense && isLicenseSettledInvalid
      ? {
          licenseCheckFailed: licenseGate.checkFailed,
          licenseStatus: licenseGate.status,
          licenseRejectionReason: licenseGate.rejectionReason,
        }
      : null

  return {
    currentStep,
    showOrderSummary: currentStep !== 5,
    view,
    licenseWarning,
  }
}
