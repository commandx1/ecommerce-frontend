"use client"

import { useRouter } from "next/navigation"
import { useEffect, useRef } from "react"
import SurfaceCard from "@/components/ui/SurfaceCard"
import OrderConfirmationActions from "@/features/checkout/components/OrderConfirmationActions"
import OrderConfirmationAutoOrderNotice from "@/features/checkout/components/OrderConfirmationAutoOrderNotice"
import OrderConfirmationHeader from "@/features/checkout/components/OrderConfirmationHeader"
import OrderConfirmationItems from "@/features/checkout/components/OrderConfirmationItems"
import OrderConfirmationShipping from "@/features/checkout/components/OrderConfirmationShipping"
import OrderConfirmationStats from "@/features/checkout/components/OrderConfirmationStats"
import { useAutoOrderRegistration } from "@/features/checkout/hooks/useAutoOrderRegistration"
import { useCartStore } from "@/stores/cartStore"
import { useCheckoutStore } from "@/stores/checkoutStore"

export default function OrderConfirmation() {
  const router = useRouter()
  const { clearCart } = useCartStore()
  const { reset, orderResult, selectedVendorShippingMethods, selectedShippingCost } = useCheckoutStore()
  const autoOrderRegistration = useAutoOrderRegistration()
  const confirmationRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    confirmationRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
  }, [])

  const onContinueShopping = () => {
    void clearCart()
    reset()
    router.push("/")
  }

  return (
    <div ref={confirmationRef}>
      <SurfaceCard variant="editorial" className="mb-8 p-12">
        <OrderConfirmationHeader />
        {orderResult ? (
          <>
            <div className="mb-10 grid gap-6 lg:grid-cols-2">
              <OrderConfirmationStats orderResult={orderResult} />
              <OrderConfirmationShipping
                vendorShippingMethods={selectedVendorShippingMethods}
                totalShippingCost={selectedShippingCost}
              />
            </div>
            <OrderConfirmationItems orderResult={orderResult} />
          </>
        ) : null}
        <OrderConfirmationAutoOrderNotice {...autoOrderRegistration} />

        <OrderConfirmationActions onContinueShopping={onContinueShopping} />
      </SurfaceCard>
    </div>
  )
}
