import formatCurrency from "@/lib/helpers/formatCurrency"

interface OrderSummaryTotalsProps {
  itemCount: number
  shipping: number
  subtotal: number
  tax: number
  taxExemption: number
  total: number
  volumeDiscount: number
}

export default function OrderSummaryTotals({
  itemCount,
  shipping,
  subtotal,
  tax,
  taxExemption,
  total,
  volumeDiscount,
}: OrderSummaryTotalsProps) {
  return (
    <div className="space-y-3 mb-6">
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">Subtotal ({itemCount} items)</span>
        <span className="font-medium">{formatCurrency(subtotal)}</span>
      </div>
      {volumeDiscount > 0 ? (
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Volume discount (5%)</span>
          <span className="font-medium text-green-600">-{formatCurrency(volumeDiscount)}</span>
        </div>
      ) : null}
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">Shipping</span>
        <span className="font-medium">{shipping === 0 ? "Free" : formatCurrency(shipping)}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">Tax</span>
        <span className="font-medium">{formatCurrency(tax)}</span>
      </div>
      {taxExemption > 0 ? (
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Tax exemption applied</span>
          <span className="font-medium text-green-600">-{formatCurrency(taxExemption)}</span>
        </div>
      ) : null}
      <div className="border-t border-gray-200 pt-3">
        <div className="flex justify-between">
          <span className="text-lg font-bold text-gray-900">Total</span>
          <span className="text-lg font-bold text-steel-blue">{formatCurrency(total)}</span>
        </div>
      </div>
    </div>
  )
}
