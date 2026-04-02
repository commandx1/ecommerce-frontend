import type { PlaceOrderResponse } from "@/lib/api/orders"
import formatCurrency from "@/lib/helpers/formatCurrency"

interface OrderConfirmationStatsProps {
  orderResult: PlaceOrderResponse
}

export default function OrderConfirmationStats({ orderResult }: OrderConfirmationStatsProps) {
  const createdDate = orderResult.createdDate ? new Date(orderResult.createdDate) : null
  const itemCount = orderResult.orderItems.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <div className="grid gap-6 mb-10 lg:grid-cols-3">
      <div className="bg-gray-50 rounded-xl p-6">
        <div className="text-sm text-gray-600 mb-2">Order ID</div>
        <div className="text-base font-mono break-all text-gray-900 mb-4">{orderResult.orderId}</div>
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Status</span>
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold ${
              orderResult.status === "PAYMENT_SUCCESS" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
            }`}
          >
            {orderResult.status}
          </span>
        </div>
      </div>

      <div className="bg-gray-50 rounded-xl p-6">
        <div className="text-sm text-gray-600 mb-2">Order Date</div>
        <div className="text-base font-semibold text-gray-900 mb-4">
          {createdDate ? createdDate.toLocaleString() : "-"}
        </div>
        <div className="text-sm text-gray-600 mb-2">Total Price</div>
        <div className="text-2xl font-bold text-steel-blue">{formatCurrency(orderResult.totalPrice)}</div>
      </div>

      <div className="bg-gray-50 rounded-xl p-6">
        <div className="text-sm text-gray-600 mb-2">Items Count</div>
        <div className="text-2xl font-bold text-steel-blue mb-4">{itemCount}</div>
        <div className="text-xs text-gray-600">
          You will receive an email confirmation shortly with your order details and tracking information.
        </div>
      </div>
    </div>
  )
}
