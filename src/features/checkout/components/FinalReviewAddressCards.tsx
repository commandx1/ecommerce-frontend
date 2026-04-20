import AddressContactInfo from "@/features/checkout/components/AddressContactInfo"
import type { ShippingAddress } from "@/stores/checkoutStore"

interface FinalReviewAddressCardsProps {
  shippingAddress: ShippingAddress
}

export default function FinalReviewAddressCards({ shippingAddress }: FinalReviewAddressCardsProps) {
  return (
    <div className="rounded-xl border border-border-soft bg-surface p-6">
      <h3 className="mb-4 text-lg font-semibold text-text-primary">Shipping Address</h3>
      <div className="text-sm text-text-secondary">
        <AddressContactInfo
          title={shippingAddress.company}
          address={`${shippingAddress.street}, ${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.zipCode}`}
          phone={shippingAddress.phone}
        />
      </div>
    </div>
  )
}
