import { ExternalLink } from "lucide-react"
import type { PlaceOrderResponse } from "@/lib/api/orders"
import formatCurrency from "@/lib/helpers/formatCurrency"

interface OrderConfirmationItemsProps {
  orderResult: PlaceOrderResponse
}

export default function OrderConfirmationItems({ orderResult }: OrderConfirmationItemsProps) {
  if (orderResult.orderItems.length === 0) return null

  return (
    <div className="mb-10">
      <h3 className="text-xl font-semibold text-steel-blue mb-4">Order Items</h3>
      <div className="space-y-4">
        {orderResult.orderItems.map((item) => (
          <div
            key={item.id}
            className="border border-gray-100 rounded-xl p-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4"
          >
            <div>
              <div className="text-sm text-gray-500 mb-1">Item ID</div>
              <div className="text-sm font-mono break-all text-gray-900 mb-2">{item.id}</div>
              <div className="text-xs text-gray-500 mb-1">User Product ID</div>
              <div className="text-xs font-mono break-all text-gray-700 mb-2">{item.userProductId}</div>
              <div className="flex items-center gap-4 text-sm text-gray-700 mt-2">
                <span>
                  Qty: <span className="font-semibold">{item.quantity}</span>
                </span>
                <span>
                  Price: <span className="font-semibold">{formatCurrency(item.price)}</span>
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    item.status === "WAITING_FOR_SHIPMENT" ? "bg-amber-50 text-amber-700" : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {item.status}
                </span>
              </div>
            </div>

            {item.trackingLink && item.trackingLink.length > 0 ? (
              <div>
                <div className="text-xs font-medium text-gray-600 mb-1">Tracking Links</div>
                <div className="flex flex-wrap gap-2">
                  {item.trackingLink.map((link, index) => (
                    <a
                      key={link}
                      href={link}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium hover:bg-green-200"
                    >
                      Tracking Link {index + 1}
                      <ExternalLink className="w-4 h-4 ml-3" />
                    </a>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  )
}
