import { Truck } from "lucide-react"
import formatCurrency from "@/lib/helpers/formatCurrency"
import type { VendorShippingSelection } from "@/stores/checkoutStore"

interface OrderConfirmationShippingProps {
  vendorShippingMethods: Record<string, VendorShippingSelection>
  totalShippingCost: number
}

export default function OrderConfirmationShipping({
  vendorShippingMethods,
  totalShippingCost,
}: OrderConfirmationShippingProps) {
  const methods = Object.values(vendorShippingMethods)

  if (methods.length === 0 && totalShippingCost <= 0) {
    return null
  }

  return (
    <div className="h-full rounded-xl border border-border-soft bg-surface p-6">
      <div className="mb-4 flex items-center gap-2">
        <Truck className="h-5 w-5 text-brand" />
        <h3 className="text-lg font-semibold text-text-primary">Shipping Methods</h3>
      </div>

      {methods.length > 0 ? (
        <div className="space-y-3">
          {methods.map((method) => (
            <div
              key={`${method.sellerName}-${method.methodText}`}
              className="flex flex-col gap-1 rounded-lg border border-border-soft bg-surface-elevated p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="text-sm text-text-primary">
                <span className="font-medium">{method.sellerName}:</span> {method.methodText}
              </div>
              <div className="text-sm font-semibold text-brand">{formatCurrency(method.amount ?? 0)}</div>
            </div>
          ))}
        </div>
      ) : null}

      <div className="mt-4 flex items-center justify-between border-t border-border-soft pt-4">
        <span className="text-sm text-text-secondary">Total Shipping</span>
        <span className="text-base font-bold text-brand">{formatCurrency(totalShippingCost)}</span>
      </div>
    </div>
  )
}
