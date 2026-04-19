"use client"

import { useRouter } from "next/navigation"
import SurfaceCard from "@/components/ui/SurfaceCard"
import OrderConfirmationActions from "@/features/checkout/components/OrderConfirmationActions"
import OrderConfirmationHeader from "@/features/checkout/components/OrderConfirmationHeader"
import { useCartStore } from "@/stores/cartStore"
import { useCheckoutStore } from "@/stores/checkoutStore"

export default function OrderConfirmation() {
  const router = useRouter()
  const { clearCart } = useCartStore()
  const { reset } = useCheckoutStore()

  const onContinueShopping = () => {
    void clearCart()
    reset()
    router.push("/")
  }

  return (
    <SurfaceCard variant="editorial" className="mb-8 p-12">
      <OrderConfirmationHeader />
      <OrderConfirmationActions onContinueShopping={onContinueShopping} />
    </SurfaceCard>
  )
}
