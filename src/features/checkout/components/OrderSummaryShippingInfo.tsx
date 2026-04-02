import { Truck } from "lucide-react"
import type { ShippingAddress } from "@/stores/checkoutStore"

interface OrderSummaryShippingInfoProps {
  currentStep: number
  etaText: string
  onChangeAddress: () => void
  shippingAddress: ShippingAddress
}

export default function OrderSummaryShippingInfo({
  currentStep,
  etaText,
  onChangeAddress,
  shippingAddress,
}: OrderSummaryShippingInfoProps) {
  if (currentStep < 2) return null

  return (
    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">Shipping to:</span>
        {currentStep === 2 ? (
          <button type="button" className="text-steel-blue hover:underline text-xs" onClick={onChangeAddress}>
            Change
          </button>
        ) : null}
      </div>
      <div className="text-sm text-gray-600">
        <div className="font-medium">{shippingAddress.company}</div>
        <div>{shippingAddress.street}</div>
        <div>
          {shippingAddress.city}, {shippingAddress.state} {shippingAddress.zipCode}
        </div>
      </div>
      <div className="mt-3 flex items-center text-sm">
        <Truck className="w-4 h-4 text-steel-blue mr-2" />
        <span className="text-gray-700">{etaText}</span>
      </div>
    </div>
  )
}
