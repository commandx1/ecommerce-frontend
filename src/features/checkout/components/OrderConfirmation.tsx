"use client"

import { useRouter } from "next/navigation"
import SurfaceCard from "@/components/ui/SurfaceCard"
import OrderConfirmationActions from "@/features/checkout/components/OrderConfirmationActions"
import OrderConfirmationHeader from "@/features/checkout/components/OrderConfirmationHeader"
import OrderConfirmationItems from "@/features/checkout/components/OrderConfirmationItems"
import OrderConfirmationStats from "@/features/checkout/components/OrderConfirmationStats"
import { useCartStore } from "@/stores/cartStore"
import { useCheckoutStore } from "@/stores/checkoutStore"

export default function OrderConfirmation() {
  const router = useRouter()
  const { clearCart } = useCartStore()
  const { orderResult, reset } = useCheckoutStore()

  const onContinueShopping = () => {
    void clearCart()
    reset()
    router.push("/")
  }

  return (
    <SurfaceCard variant="editorial" className="mb-8 p-12">
      <OrderConfirmationHeader />
      {orderResult ? <OrderConfirmationStats orderResult={orderResult} /> : null}
      {orderResult ? <OrderConfirmationItems orderResult={orderResult} /> : null}
      <OrderConfirmationActions onContinueShopping={onContinueShopping} />
    </SurfaceCard>
  )
}
