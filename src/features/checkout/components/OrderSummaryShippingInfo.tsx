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
    <div className="mb-6 rounded-[1.25rem] border border-border-soft bg-surface p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium text-text-primary">Shipping to:</span>
        {currentStep === 2 ? (
          <button type="button" className="text-xs text-brand hover:underline" onClick={onChangeAddress}>
            Change
          </button>
        ) : null}
      </div>
      <div className="text-sm text-text-secondary">
        <div className="font-medium text-text-primary">{shippingAddress.company}</div>
        <div>{shippingAddress.street}</div>
        <div>
          {shippingAddress.city}, {shippingAddress.state} {shippingAddress.zipCode}
        </div>
      </div>
      <div className="mt-3 flex items-center text-sm">
        <Truck className="mr-2 h-4 w-4 text-brand" />
        <span className="text-text-primary">{etaText}</span>
      </div>
    </div>
  )
}
