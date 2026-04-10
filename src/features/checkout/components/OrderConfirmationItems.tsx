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
      <h3 className="mb-4 text-xl font-semibold text-text-primary">Order Items</h3>
      <div className="space-y-4">
        {orderResult.orderItems.map((item) => (
          <div
            key={item.id}
            className="flex flex-col gap-4 rounded-xl border border-border-soft bg-surface p-4 sm:flex-row sm:items-start sm:justify-between"
          >
            <div>
              <div className="mb-1 text-sm text-text-muted">Item ID</div>
              <div className="mb-2 break-all font-mono text-sm text-text-primary">{item.id}</div>
              <div className="mb-1 text-xs text-text-muted">User Product ID</div>
              <div className="mb-2 break-all font-mono text-xs text-text-secondary">{item.userProductId}</div>
              <div className="mt-2 flex items-center gap-4 text-sm text-text-secondary">
                <span>
                  Qty: <span className="font-semibold">{item.quantity}</span>
                </span>
                <span>
                  Price: <span className="font-semibold">{formatCurrency(item.price)}</span>
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    item.status === "WAITING_FOR_SHIPMENT"
                      ? "bg-warning/15 text-warning"
                      : "bg-surface-muted text-text-secondary"
                  }`}
                >
                  {item.status}
                </span>
              </div>
            </div>

            {item.trackingLink && item.trackingLink.length > 0 ? (
              <div>
                <div className="mb-1 text-xs font-medium text-text-secondary">Tracking Links</div>
                <div className="flex flex-wrap gap-2">
                  {item.trackingLink.map((link, index) => (
                    <a
                      key={link}
                      href={link}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center rounded-full bg-success/15 px-3 py-1 text-xs font-medium text-success transition-colors hover:bg-success/20"
                    >
                      Tracking Link {index + 1}
                      <ExternalLink className="ml-3 h-4 w-4" />
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
