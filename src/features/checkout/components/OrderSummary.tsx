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
  const {
    currentStep,
    isTaxLoading,
    items,
    selectedShippingEtaText,
    selectedVendorShippingMethods,
    shipping,
    shippingAddress,
    subtotal,
    tax,
    total,
    volumeDiscount,
  } = useOrderSummary()

  if (currentStep === 5) return null

  return (
    <SurfaceCard variant="technical" className="sticky top-40 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-text-primary">Order Summary</h3>
        <button
          type="button"
          onClick={() => router.push("/cart")}
          className="text-sm font-medium text-brand hover:underline"
        >
          Edit Cart
        </button>
      </div>

      <OrderSummaryItems items={items} />

      <OrderSummaryShippingInfo
        currentStep={currentStep}
        etaText={selectedShippingEtaText}
        vendorShippingMethods={selectedVendorShippingMethods}
        shippingAddress={shippingAddress}
        onChangeAddress={() => router.push("/checkout")}
      />

      <OrderSummaryTotals
        isTaxLoading={isTaxLoading}
        itemCount={items.reduce((totalQuantity, item) => totalQuantity + item.quantity, 0)}
        subtotal={subtotal}
        shipping={shipping}
        tax={tax}
        total={total}
        volumeDiscount={volumeDiscount}
      />

      <OrderSummaryTrustBadges />
    </SurfaceCard>
  )
}
