"use client"

import { useRouter } from "next/navigation"
import SurfaceCard from "@/components/ui/SurfaceCard"
import OrderSummaryItems from "@/features/checkout/components/OrderSummaryItems"
import OrderSummaryShippingInfo from "@/features/checkout/components/OrderSummaryShippingInfo"
import OrderSummaryTotals from "@/features/checkout/components/OrderSummaryTotals"
import OrderSummaryTrustBadges from "@/features/checkout/components/OrderSummaryTrustBadges"
import { useOrderSummary } from "@/features/checkout/hooks/useOrderSummary"

export default function OrderSummary() {
  const router = useRouter()
  const { currentStep, items, selectedShippingEtaText, shipping, shippingAddress, subtotal, total, volumeDiscount } =
    useOrderSummary()

  if (currentStep === 5) return null

  return (
    <SurfaceCard className="sticky top-8 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-steel-blue">Order Summary</h3>
        <button
          type="button"
          onClick={() => router.push("/cart")}
          className="text-steel-blue hover:underline text-sm font-medium"
        >
          Edit Cart
        </button>
      </div>

      <OrderSummaryItems items={items} />

      <OrderSummaryShippingInfo
        currentStep={currentStep}
        etaText={selectedShippingEtaText}
        shippingAddress={shippingAddress}
        onChangeAddress={() => router.push("/checkout")}
      />

      <OrderSummaryTotals
        itemCount={items.length}
        subtotal={subtotal}
        shipping={shipping}
        total={total}
        volumeDiscount={volumeDiscount}
      />

      <OrderSummaryTrustBadges />
    </SurfaceCard>
  )
}
