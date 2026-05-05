import type { PlaceOrderResponse } from "@/lib/api/orders"
import formatCurrency from "@/lib/helpers/formatCurrency"

interface OrderConfirmationStatsProps {
  orderResult: PlaceOrderResponse
}

function formatStatusLabel(status: string): string {
  return status
    .replaceAll("_", " ")
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function getStatusToneClass(status: string): string {
  const normalizedStatus = status.toLowerCase()
  if (normalizedStatus === "succeeded") return "bg-success/15 text-success border border-success/25"
  if (normalizedStatus === "canceled") return "bg-danger/12 text-danger border border-danger/25"
  return "bg-warning/14 text-warning border border-warning/25"
}

export default function OrderConfirmationStats({ orderResult }: OrderConfirmationStatsProps) {
  const paymentStatus = (orderResult.paymentStatus || orderResult.status || "unknown").toLowerCase()
  const today = new Date().toLocaleDateString()

  return (
    <div className="h-full rounded-xl border border-border-soft bg-surface p-6">
      <div className="mb-2 text-sm text-text-secondary">Payment Status</div>
      <div className="mb-4">
        <span
          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusToneClass(paymentStatus)}`}
        >
          {formatStatusLabel(paymentStatus)}
        </span>
      </div>

      <div className="mb-2 text-sm text-text-secondary">Order Date</div>
      <div className="mb-4 text-base font-semibold text-text-primary">{today}</div>

      <div className="mb-2 text-sm text-text-secondary">Total Price</div>
      <div className="text-2xl font-bold text-brand">{formatCurrency(orderResult.totalPrice)}</div>
    </div>
  )
}
