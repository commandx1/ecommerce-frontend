import { Loader2 } from "lucide-react"
import formatCurrency from "@/lib/helpers/formatCurrency"
import { hasHeavyShipmentFee } from "@/lib/helpers/shipping"

interface OrderSummaryTotalsProps {
  isTaxLoading: boolean
  itemCount: number
  shipping: number
  hasSelectedShipping: boolean
  heavyShipmentFee: number
  subtotal: number
  // null = tax could not be estimated yet (no address, or the estimate call failed) — render as
  // "calculated at checkout", not $0.00.
  tax: number | null
  total: number
  volumeDiscount: number
}

export default function OrderSummaryTotals({
  isTaxLoading,
  itemCount,
  shipping,
  hasSelectedShipping,
  heavyShipmentFee,
  subtotal,
  tax,
  total,
  volumeDiscount,
}: OrderSummaryTotalsProps) {
  return (
    <div className="mb-6 space-y-3">
      <div className="flex justify-between text-sm">
        <span className="text-text-secondary">Subtotal ({itemCount} items)</span>
        <span className="font-medium text-text-primary">{formatCurrency(subtotal)}</span>
      </div>
      {volumeDiscount > 0 ? (
        <div className="flex justify-between text-sm">
          <span className="text-text-secondary">Volume discount (5%)</span>
          <span className="font-medium text-success">-{formatCurrency(volumeDiscount)}</span>
        </div>
      ) : null}
      {hasSelectedShipping ? (
        <div className="flex justify-between text-sm">
          <span className="text-text-secondary">Shipment fee</span>
          <span className="font-medium text-text-primary">{shipping === 0 ? "Free" : formatCurrency(shipping)}</span>
        </div>
      ) : null}
      {hasHeavyShipmentFee(heavyShipmentFee) ? (
        <div className="flex justify-between text-sm">
          <span className="text-text-secondary">Heavy shipment fee</span>
          <span className="font-medium text-text-primary">{formatCurrency(heavyShipmentFee)}</span>
        </div>
      ) : null}
      <div className="flex justify-between text-sm">
        <span className="text-text-secondary">Estimated Tax</span>
        {isTaxLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-text-secondary" />
        ) : tax === null ? (
          <span className="text-sm italic text-text-secondary">Calculated at checkout</span>
        ) : (
          <span className="font-medium text-text-primary">{formatCurrency(tax)}</span>
        )}
      </div>
      <div className="border-t border-border-soft pt-3">
        <div className="flex justify-between">
          <span className="text-lg font-bold text-text-primary">Total</span>
          <span className="text-lg font-bold text-brand">{formatCurrency(total)}</span>
        </div>
        {!isTaxLoading && tax === null ? (
          <p className="mt-1 text-right text-xs text-text-secondary">Excludes tax — calculated at checkout.</p>
        ) : null}
      </div>
    </div>
  )
}
