import ActionButton from "@/components/ui/ActionButton"
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
    <SurfaceCard variant="technical" className="sticky top-6 p-6">
      <h3 className="mb-6 text-xl font-bold text-text-primary">Order Summary</h3>
      <div className="mb-6 space-y-3">
        {summaryRows.map((row) => (
          <div key={row.label} className="flex justify-between text-sm">
            <span className="text-text-secondary">{row.label}</span>
            <span className="font-medium text-text-primary">{row.value}</span>
          </div>
        ))}
        <div className="border-t border-border-soft pt-3">
          <div className="flex justify-between">
            <span className="text-lg font-bold text-text-primary">Total</span>
            <span className="text-lg font-bold text-brand">{formatCurrency(totals.total)}</span>
          </div>
        </div>
      </div>
      <ActionButton
        type="button"
        disabled={isCheckoutDisabled}
        onClick={onCheckout}
        fullWidth
        className="text-lg disabled:bg-surface-muted disabled:text-text-muted"
      >
        Proceed to Checkout
      </ActionButton>
    </SurfaceCard>
  )
}
