import { Truck } from "lucide-react"
import type { ShippingAddress, VendorShippingSelection } from "@/stores/checkoutStore"
import AddressContactInfo from "./AddressContactInfo"

interface OrderSummaryShippingInfoProps {
  currentStep: number
  etaText: string
  onChangeAddress: () => void
  shippingAddress: ShippingAddress
  vendorShippingMethods: Record<string, VendorShippingSelection>
}

export default function OrderSummaryShippingInfo({
  currentStep,
  etaText,
  onChangeAddress,
  shippingAddress,
  vendorShippingMethods,
}: OrderSummaryShippingInfoProps) {
  if (currentStep < 2) return null

  const vendorMethods = Object.values(vendorShippingMethods)

  return (
    <div className="mb-6 rounded-[1.25rem] border border-border-soft bg-surface p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium text-text-primary">Shipping to:</span>
        {currentStep === 2 ? (
          <button type="button" className="text-xs text-brand hover:underline" onClick={onChangeAddress}>
            Change
          </button>
        ) : null}
      </div>
      <AddressContactInfo
        title={shippingAddress.company}
        address={`${shippingAddress.street}, ${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.zipCode}`}
        phone={shippingAddress.phone}
      />
      {vendorMethods.length > 0 ? (
        <div className="mt-3 space-y-2">
          {vendorMethods.map((vendorMethod) => (
            <div key={`${vendorMethod.sellerName}-${vendorMethod.methodText}`} className="flex items-center text-sm">
              <Truck className="mr-2 h-4 w-4 text-text-muted" />
              <span className="text-text-primary">
                <span className="font-medium">{vendorMethod.sellerName}:</span> {vendorMethod.methodText}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-3 flex items-center text-sm">
          <Truck className="mr-2 h-4 w-4 text-text-muted" />
          <span className="text-text-primary">{etaText}</span>
        </div>
      )}
    </div>
  )
}
