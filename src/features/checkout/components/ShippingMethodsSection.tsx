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
    <SurfaceCard variant="technical" className="p-8">
      <div className="mb-8 flex items-center">
        <div className="mr-4 flex h-8 w-8 items-center justify-center rounded-full bg-brand">
          <span className="text-sm font-semibold text-white">3</span>
        </div>
        <h2 className="text-2xl font-bold text-text-primary">Shipping Methods</h2>
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
