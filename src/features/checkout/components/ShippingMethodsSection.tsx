import SurfaceCard from "@/components/ui/SurfaceCard"
import VendorShipmentRates from "@/features/checkout/components/VendorShipmentRates"
import type { SellerGroup, ShippingRate } from "@/features/checkout/types"

interface ShippingMethodsSectionProps {
  addressId: string
  cartId: string
  selectedRates: Record<string, { type: "shippo" | "uber"; rateId: string }>
  sellerGroups: Record<string, SellerGroup>
  onRateSelect: (vendorId: string, rate: ShippingRate) => void
}

export default function ShippingMethodsSection({
  addressId,
  cartId,
  selectedRates,
  sellerGroups,
  onRateSelect,
}: ShippingMethodsSectionProps) {
  return (
    <SurfaceCard className="p-8">
      <div className="flex items-center mb-8">
        <div className="w-8 h-8 bg-steel-blue rounded-full flex items-center justify-center mr-4">
          <span className="text-white text-sm font-semibold">3</span>
        </div>
        <h2 className="text-2xl font-bold text-steel-blue">Shipping Methods</h2>
      </div>

      <div className="space-y-8">
        {Object.entries(sellerGroups).map(([sellerId, group]) => (
          <VendorShipmentRates
            key={sellerId}
            sellerId={sellerId}
            sellerName={group.name}
            items={group.items}
            addressId={addressId}
            cartId={cartId}
            selectedRateId={selectedRates[sellerId]?.rateId}
            onSelect={onRateSelect}
          />
        ))}
      </div>
    </SurfaceCard>
  )
}
