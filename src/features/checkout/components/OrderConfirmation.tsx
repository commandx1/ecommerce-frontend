"use client"

import { useRouter } from "next/navigation"
import { useEffect, useMemo, useRef } from "react"
import SurfaceCard from "@/components/ui/SurfaceCard"
import OrderConfirmationActions from "@/features/checkout/components/OrderConfirmationActions"
import OrderConfirmationHeader from "@/features/checkout/components/OrderConfirmationHeader"
import OrderConfirmationItems from "@/features/checkout/components/OrderConfirmationItems"
import OrderConfirmationShipping from "@/features/checkout/components/OrderConfirmationShipping"
import OrderConfirmationStats from "@/features/checkout/components/OrderConfirmationStats"
import { useAutoOrderRegistration } from "@/features/checkout/hooks/useAutoOrderRegistration"
import type { AutoOrderPeriod } from "@/lib/constants/auto-order"
import { useCartStore } from "@/stores/cartStore"
import { useCheckoutStore } from "@/stores/checkoutStore"

export default function OrderConfirmation() {
  const router = useRouter()
  const { clearCart } = useCartStore()
  const {
    reset,
    orderResult,
    orderPayload,
    autoOrderUserProductIds,
    selectedVendorShippingMethods,
    selectedShippingCost,
  } = useCheckoutStore()
  const { status: autoOrderStatus } = useAutoOrderRegistration()
  const confirmationRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    confirmationRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
  }, [])

  /**
   * The order response carries no schedule, so the repeat lines are read back off the payload
   * snapshot that was actually sent. `autoOrderUserProductIds` is the fallback: it always lists the
   * repeating lines, just without naming their period.
   */
  const autoOrderPeriods = useMemo(() => {
    const periods: Record<string, AutoOrderPeriod | null> = {}

    for (const userProductId of autoOrderUserProductIds) {
      periods[userProductId] = null
    }

    const rateOrders = [...(orderPayload?.shippoRateOrders ?? []), ...(orderPayload?.uberRateOrders ?? [])]
    for (const rateOrder of rateOrders) {
      for (const product of rateOrder?.products ?? []) {
        if (product?.autoOrder) periods[product.userProductId] = product.autoOrder
      }
    }

    return periods
  }, [orderPayload, autoOrderUserProductIds])

  const onContinueShopping = () => {
    void clearCart()
    reset()
    router.push("/products")
  }

  return (
    <div ref={confirmationRef}>
      <SurfaceCard variant="editorial" className="mb-8 p-12">
        <OrderConfirmationHeader />
        {orderResult ? (
          <>
            <OrderConfirmationItems
              orderResult={orderResult}
              autoOrderPeriods={autoOrderPeriods}
              autoOrderPending={autoOrderStatus === "pending"}
            />
            <div className="mb-10 grid gap-6 lg:grid-cols-2">
              <OrderConfirmationStats orderResult={orderResult} />
              <OrderConfirmationShipping
                vendorShippingMethods={selectedVendorShippingMethods}
                totalShippingCost={selectedShippingCost}
              />
            </div>
          </>
        ) : null}

        <OrderConfirmationActions onContinueShopping={onContinueShopping} />
      </SurfaceCard>
    </div>
  )
}
