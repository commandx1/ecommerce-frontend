"use client"

import { ExternalLink, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import ProductImageWithFallback from "@/features/products/listing/components/ProductImageWithFallback"
import FulfillmentTimeline from "@/app/buyer-dashboard/orders/components/fulfillment-timeline"
import { formatOrderItemStatus, getOrderItemStatusTagClass } from "@/app/buyer-dashboard/orders/lib/order-view-utils"
import { type VendorOrder, type VendorOrderItem } from "@/lib/api/vendor-orders"
import { getFullImageUrl } from "@/lib/api/products"
import { isCancelableOrderItemStatus } from "@/lib/constants/order-item-status"
import formatCurrency from "@/lib/helpers/formatCurrency"

interface CancelActionOptions {
  cancelingItemId?: string
  cancelingOrderId?: string
}

interface VendorOrderExpandedContentProps {
  order: VendorOrder
  orderDate: string
  cancelingItemId: string | null
  cancelingOrderId: string | null
  returnActionItemId: string | null
  returnActionType: "confirm" | "reject" | null
  onOpenLabelModal: (links: { shipping: string[]; tracking: string[] }) => void
  onRequestCancel: (action: {
    orderItemIds: string[]
    description: string
    options?: CancelActionOptions
  }) => void
  onConfirmReturn: (item: VendorOrderItem) => void
  onRejectReturn: (item: VendorOrderItem) => void
}

function resolveVendorTrackingUrls(item: VendorOrderItem): string[] {
  if (Array.isArray(item.trackingLinks) && item.trackingLinks.length > 0) {
    return item.trackingLinks
      .map((entry) => entry?.trackingUrl)
      .filter((url): url is string => typeof url === "string" && url.length > 0)
  }
  if (Array.isArray(item.trackingLink)) {
    return item.trackingLink.filter((url): url is string => typeof url === "string" && url.length > 0)
  }
  return []
}

function resolveVendorShippingUrls(item: VendorOrderItem): string[] {
  if (Array.isArray(item.shippingLinks) && item.shippingLinks.length > 0) {
    return item.shippingLinks
      .map((entry) => entry?.shippingUrl)
      .filter((url): url is string => typeof url === "string" && url.length > 0)
  }
  if (Array.isArray(item.shippingLink)) {
    return item.shippingLink.filter((url): url is string => typeof url === "string" && url.length > 0)
  }
  return []
}

function getVendorShipmentFee(item: VendorOrderItem): number {
  if (item.shipmentFreeBySeller) return 0
  if (typeof item.takedShipmentPrice === "number") {
    return item.takedShipmentPrice
  }
  const fromShippingLink = item.shippingLinks?.find((link) => typeof link?.shipmentPrice === "number")?.shipmentPrice
  return typeof fromShippingLink === "number" ? fromShippingLink : 0
}

export default function VendorOrderExpandedContent({
  order,
  orderDate,
  cancelingItemId,
  cancelingOrderId,
  returnActionItemId,
  returnActionType,
  onOpenLabelModal,
  onRequestCancel,
  onConfirmReturn,
}: VendorOrderExpandedContentProps) {
  return (
    <div className="bg-surface-muted/55 p-6 shadow-inner">
      <div className="space-y-3">
        {order.orderItems.map((item) => {
          const trackingUrls = resolveVendorTrackingUrls(item)
          const shippingUrls = resolveVendorShippingUrls(item)
          const isCancelledByParty = Boolean(item.cancelledByCustomer) || Boolean(item.cancelledBySeller)
          const normalizedReturnStatus = item.returnRefundStatus?.toUpperCase()
          const normalizedItemStatus = item.status.toUpperCase()
          const canManageDeliveredReturn =
            normalizedReturnStatus === "DELIVERED" && normalizedItemStatus === "DELIVERED"
          const isConfirmingReturn = returnActionItemId === item.id && returnActionType === "confirm"
          const isReturnActionLoading = isConfirmingReturn
          const hasReturnFlow = Boolean(item.returnRefundStatus)
          const metadataStatusValue = hasReturnFlow ? item.returnRefundStatus ?? item.status : item.status
          const metadataStatusLabel = hasReturnFlow
            ? `Return ${formatOrderItemStatus(metadataStatusValue)}`
            : formatOrderItemStatus(metadataStatusValue)

          return (
            <div
              key={item.id}
              className="rounded-[8px] border border-border-soft bg-surface-muted/30 p-3 transition-colors hover:border-border-soft"
            >
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_240px]">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md bg-surface-elevated shadow-sm">
                    <ProductImageWithFallback
                      src={getFullImageUrl(item.productCoverPhotoPath) || "/dentypro-product-placeholder.png"}
                      alt={item.productName}
                      width={48}
                      height={48}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="relative h-full min-w-0 flex-1">
                    <p className="mb-2 max-w-96 text-sm font-medium text-text-primary">{item.productName}</p>

                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-text-muted">
                      <span className="rounded bg-surface-muted px-2 py-0.5">
                        Qty: {item.quantity} unit{item.quantity > 1 ? "s" : ""}
                      </span>
                      <span>•</span>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${getOrderItemStatusTagClass(metadataStatusValue)}`}
                      >
                        {metadataStatusLabel}
                      </span>
                      <span>•</span>
                      <span className="font-semibold text-text-primary">
                        {item.totalPrice === 0 ? "FREE" : formatCurrency(item.totalPrice)}
                      </span>
                      {item.quantity > 1 ? (
                        <span className="text-[11px] text-text-muted">({formatCurrency(item.price)} each)</span>
                      ) : null}
                      <span>•</span>
                      {item.shipmentFreeBySeller ? (
                        <span className="font-semibold text-success">Free Shipping</span>
                      ) : (
                        <span className="font-semibold text-text-secondary">
                          Shipment: {formatCurrency(getVendorShipmentFee(item))}
                        </span>
                      )}
                    </div>

                    <div className="mt-3 flex w-full flex-wrap items-center gap-2 border-t border-border-soft pt-3">
                      {shippingUrls.length > 0 || trackingUrls.length > 0 ? (
                        <Button
                          type="button"
                          variant="unstyled"
                          onClick={() =>
                            onOpenLabelModal({
                              shipping: shippingUrls,
                              tracking: trackingUrls,
                            })
                          }
                          className="inline-flex items-center gap-1 rounded-[8px] border border-success/40 bg-success/15 px-2.5 py-1 text-[11px] font-semibold text-success hover:bg-success/25"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Track / Labels
                        </Button>
                      ) : null}

                      {isCancelableOrderItemStatus(item.status) && !isCancelledByParty ? (
                        <Button
                          type="button"
                          variant="unstyled"
                          onClick={() =>
                            onRequestCancel({
                              orderItemIds: [item.id],
                              description: `${item.productName} cancellation request was submitted.`,
                              options: { cancelingItemId: item.id },
                            })
                          }
                          disabled={cancelingItemId === item.id || cancelingOrderId === order.orderId}
                          className="inline-flex items-center gap-1 rounded-[8px] border border-danger/40 bg-danger/15 px-2.5 py-1 text-[11px] font-semibold text-danger hover:bg-danger/25 disabled:opacity-70"
                        >
                          {cancelingItemId === item.id ? (
                            <>
                              <Loader2 className="h-3 w-3 animate-spin" />
                              Canceling...
                            </>
                          ) : (
                            "Cancel Item"
                          )}
                        </Button>
                      ) : null}

                      {canManageDeliveredReturn ? (
                        <>
                          <Button
                            type="button"
                            variant="unstyled"
                            onClick={() => onConfirmReturn(item)}
                            disabled={isReturnActionLoading}
                            className="inline-flex items-center gap-1 rounded-[8px] border border-success/40 bg-success/15 px-2.5 py-1 text-[11px] font-semibold text-success hover:bg-success/25 disabled:opacity-70"
                          >
                            {isConfirmingReturn ? (
                              <>
                                <Loader2 className="h-3 w-3 animate-spin" />
                                Approving...
                              </>
                            ) : (
                              "Approve Return"
                            )}
                          </Button>
                          {/*
                          <Button
                            type="button"
                            variant="unstyled"
                            onClick={() => onRejectReturn(item)}
                            disabled={isReturnActionLoading}
                            className="inline-flex items-center gap-1 rounded-[8px] border border-danger/40 bg-danger/15 px-2.5 py-1 text-[11px] font-semibold text-danger hover:bg-danger/25 disabled:opacity-70"
                          >
                            Reject Return
                          </Button>
                          */}
                        </>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="rounded-[8px] border border-border-soft bg-surface-elevated p-3">
                  <FulfillmentTimeline item={item} orderDate={orderDate} />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
