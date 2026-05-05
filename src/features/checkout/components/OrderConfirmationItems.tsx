import { ExternalLink } from "lucide-react"
import ProductImageWithFallback from "@/features/products/listing/components/ProductImageWithFallback"
import type { PlaceOrderResponse } from "@/lib/api/orders"
import { getFullImageUrl } from "@/lib/api/products"
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
          <div key={item.id} className="rounded-xl border border-border-soft bg-surface p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex flex-1 gap-4">
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xs border border-border-soft bg-surface-elevated">
                  <ProductImageWithFallback
                    src={getFullImageUrl(item.productCoverPhotoPath) || "/dentypro-product-placeholder.png"}
                    alt={item.productName || "Product image"}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 text-base font-semibold text-text-primary">
                    {item.productName || "Unnamed product"}
                  </div>
                  <div className="mb-2 text-sm text-text-secondary">
                    Qty: <span className="font-semibold">{item.quantity}</span> · Unit Price:{" "}
                    <span className="font-semibold">{formatCurrency(item.price)}</span>
                  </div>
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                      item.status === "PROCESSING" || item.status === "WAITING_FOR_SHIPMENT"
                        ? "bg-warning/15 text-warning"
                        : "bg-surface-muted text-text-secondary"
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
              </div>
            </div>

            {item.shippingLink && item.shippingLink.length > 0 ? (
              <div className="mt-4">
                <div className="mb-1 text-xs font-medium text-text-secondary">Shipping Links</div>
                <div className="flex flex-wrap gap-2">
                  {item.shippingLink.map((link, index) => (
                    <a
                      key={link}
                      href={link}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center rounded-full bg-brand/12 px-3 py-1 text-xs font-medium text-brand transition-colors hover:bg-brand/20"
                    >
                      Shipping Link {index + 1}
                      <ExternalLink className="ml-3 h-4 w-4" />
                    </a>
                  ))}
                </div>
              </div>
            ) : null}

            {item.trackingLink && item.trackingLink.length > 0 ? (
              <div className="mt-3">
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
