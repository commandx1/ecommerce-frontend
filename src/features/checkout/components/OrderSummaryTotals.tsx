import { Loader2 } from "lucide-react"
import formatCurrency from "@/lib/helpers/formatCurrency"

interface OrderSummaryTotalsProps {
  isTaxLoading: boolean
  itemCount: number
  shipmentFee: number
  heavyShipmentFee: number
  totalShipmentFee: number
  subtotal: number
  tax: number
  total: number
  volumeDiscount: number
}

export default function OrderSummaryTotals({
  isTaxLoading,
  itemCount,
  shipmentFee,
  heavyShipmentFee,
  totalShipmentFee,
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
      <div className="flex justify-between text-sm">
        <span className="text-text-secondary">Shipment fee</span>
        <span className="font-medium text-text-primary">
          {shipmentFee === 0 ? "Free" : formatCurrency(shipmentFee)}
        </span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-text-secondary">Heavy shipment fee</span>
        <span className="font-medium text-text-primary">
          {heavyShipmentFee === 0 ? "Free" : formatCurrency(heavyShipmentFee)}
        </span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-text-secondary">Total shipment fee</span>
        <span className="font-medium text-text-primary">
          {totalShipmentFee === 0 ? "Free" : formatCurrency(totalShipmentFee)}
        </span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-text-secondary">Estimated Tax</span>
        {isTaxLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-text-secondary" />
        ) : (
          <span className="font-medium text-text-primary">{formatCurrency(tax)}</span>
        )}
      </div>
      <div className="border-t border-border-soft pt-3">
        <div className="flex justify-between">
          <span className="text-lg font-bold text-text-primary">Total</span>
          <span className="text-lg font-bold text-brand">{formatCurrency(total)}</span>
        </div>
      </div>
    </div>
  )
}
