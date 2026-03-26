import SurfaceCard from "@/components/ui/SurfaceCard"
import type { CartTotals } from "@/features/cart/types"
import formatCurrency from "@/lib/helpers/formatCurrency"

interface CartSummaryPanelProps {
  isCheckoutDisabled: boolean
  itemsCount: number
  onCheckout: () => void
  totals: CartTotals
}

interface SummaryRow {
  label: string
  value: string
}

export default function CartSummaryPanel({
  isCheckoutDisabled,
  itemsCount,
  onCheckout,
  totals,
}: CartSummaryPanelProps) {
  const summaryRows: SummaryRow[] = [
    { label: `Subtotal (${itemsCount} items)`, value: formatCurrency(totals.subtotal) },
    { label: "Shipping", value: totals.shipping === 0 ? "Free" : formatCurrency(totals.shipping) },
  ]

  return (
    <SurfaceCard className="sticky top-6 p-6">
      <h3 className="text-xl font-bold text-steel-blue mb-6">Order Summary</h3>
      <div className="space-y-3 mb-6">
        {summaryRows.map((row) => (
          <div key={row.label} className="flex justify-between text-sm">
            <span className="text-gray-600">{row.label}</span>
            <span className="font-medium">{row.value}</span>
          </div>
        ))}
        <div className="border-t border-gray-200 pt-3">
          <div className="flex justify-between">
            <span className="text-lg font-bold text-gray-900">Total</span>
            <span className="text-lg font-bold text-steel-blue">{formatCurrency(totals.total)}</span>
          </div>
        </div>
      </div>
      <button
        type="button"
        disabled={isCheckoutDisabled}
        onClick={onCheckout}
        className="w-full bg-steel-blue text-white py-3 px-6 rounded-lg hover:bg-opacity-90 font-semibold text-lg transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
        Proceed to Checkout
      </button>
    </SurfaceCard>
  )
}
