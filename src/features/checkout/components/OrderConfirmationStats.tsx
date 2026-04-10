import type { PlaceOrderResponse } from "@/lib/api/orders"
import formatCurrency from "@/lib/helpers/formatCurrency"

interface OrderConfirmationStatsProps {
  orderResult: PlaceOrderResponse
}

export default function OrderConfirmationStats({ orderResult }: OrderConfirmationStatsProps) {
  const createdDate = orderResult.createdDate ? new Date(orderResult.createdDate) : null
  const itemCount = orderResult.orderItems.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <div className="mb-10 grid gap-6 lg:grid-cols-3">
      <div className="rounded-xl border border-border-soft bg-surface p-6">
        <div className="mb-2 text-sm text-text-secondary">Order ID</div>
        <div className="mb-4 break-all font-mono text-base text-text-primary">{orderResult.orderId}</div>
        <div className="flex items-center justify-between text-sm text-text-secondary">
          <span>Status</span>
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold ${
              orderResult.status === "PAYMENT_SUCCESS" ? "bg-success/15 text-success" : "bg-warning/15 text-warning"
            }`}
          >
            {orderResult.status}
          </span>
        </div>
      </div>

      <div className="rounded-xl border border-border-soft bg-surface p-6">
        <div className="mb-2 text-sm text-text-secondary">Order Date</div>
        <div className="mb-4 text-base font-semibold text-text-primary">
          {createdDate ? createdDate.toLocaleString() : "-"}
        </div>
        <div className="mb-2 text-sm text-text-secondary">Total Price</div>
        <div className="text-2xl font-bold text-brand">{formatCurrency(orderResult.totalPrice)}</div>
      </div>

      <div className="rounded-xl border border-border-soft bg-surface p-6">
        <div className="mb-2 text-sm text-text-secondary">Items Count</div>
        <div className="mb-4 text-2xl font-bold text-brand">{itemCount}</div>
        <div className="text-xs text-text-secondary">
          You will receive an email confirmation shortly with your order details and tracking information.
        </div>
      </div>
    </div>
  )
}
