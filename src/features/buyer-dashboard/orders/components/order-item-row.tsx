"use client"

import { ExternalLink, FileText, RotateCcw, Star, Undo2, XCircle } from "lucide-react"
import Link from "next/link"
import FulfillmentTimeline from "@/components/orders/FulfillmentTimeline"
import { Button } from "@/components/ui/button"
import ProductImageWithFallback from "@/features/products/listing/components/ProductImageWithFallback"
import type { BuyerOrder, BuyerOrderItem } from "@/lib/api/buyer-orders"
import { getFullImageUrl } from "@/lib/api/products"
import { isDeliveredOrderItemStatus, isPreShippingCancelableStatus } from "@/lib/constants/order-item-status"
import formatCurrency from "@/lib/helpers/formatCurrency"
import { hasHeavyShipmentFee } from "@/lib/helpers/shipping"
import { formatOrderItemStatus, getOrderItemStatusTagClass } from "@/lib/orders/order-format"
import type { useBuyerOrdersTableActions } from "../context/buyer-orders-context"
import { getItemAccentClasses } from "../lib/order-item-accent"
import { getOrderItemHeavyShipmentFee, getOrderItemShipmentFee } from "../lib/order-money"
import { resolveOrderItemProductId } from "../lib/order-view-model"
import { resolveActiveShippingLinks, resolveActiveTrackingLinks } from "../lib/tracking-links"

type OrdersTableActions = ReturnType<typeof useBuyerOrdersTableActions>

interface ReviewRequest {
  item: BuyerOrderItem
  productId: string
  vendorName: string
}

interface OrderItemRowProps {
  order: BuyerOrder
  item: BuyerOrderItem
  orderDate: string
  vendorName: string
  isReordering: boolean
  isCancelingItem: boolean
  isCancelingSellerGroup: boolean
  isReviewed: boolean
  onReorder: OrdersTableActions["handleReorder"]
  onRequestCancel: OrdersTableActions["requestCancelAction"]
  onRequestRefund: OrdersTableActions["requestRefundAction"]
  onOpenTrackingModal: OrdersTableActions["setTrackingModalLinks"]
  onWriteReview: (request: ReviewRequest) => void
}

/** A single order item's card: product header, per-item actions, and its fulfillment timeline. */
export default function OrderItemRow({
  order,
  item,
  orderDate,
  vendorName,
  isReordering,
  isCancelingItem,
  isCancelingSellerGroup,
  isReviewed,
  onReorder,
  onRequestCancel,
  onRequestRefund,
  onOpenTrackingModal,
  onWriteReview,
}: OrderItemRowProps) {
  const productId = resolveOrderItemProductId(item)
  const productHref = productId
    ? `/products/${encodeURIComponent(productId)}?vendorId=${encodeURIComponent(item.userProductId)}`
    : null
  const trackingLinks = resolveActiveTrackingLinks(item)
  const shippingLinks = resolveActiveShippingLinks(item)
  const hasReturnFlow = Boolean(item.returnRefundStatus)
  const metadataStatusValue = hasReturnFlow ? (item.returnRefundStatus ?? item.status) : item.status
  const metadataStatusLabel = hasReturnFlow
    ? `Return ${formatOrderItemStatus(metadataStatusValue)}`
    : formatOrderItemStatus(metadataStatusValue)
  const canRequestItemReturn =
    item.returnenable === true && !(typeof item.returnDate === "string" && item.returnDate.trim().length > 0)
  const canWriteReview =
    isDeliveredOrderItemStatus(item.status) &&
    productId !== null &&
    !item.cancelledByCustomer &&
    !item.cancelledBySeller
  const shipmentFee = getOrderItemShipmentFee(item)
  const heavyShipmentFee = getOrderItemHeavyShipmentFee(item)

  return (
    <div
      className={`rounded-[8px] border border-border-soft border-l-4 ${getItemAccentClasses(metadataStatusValue, Boolean(item.cancelledByCustomer), Boolean(item.cancelledBySeller))} p-4 transition-all hover:shadow-sm`}
    >
      {/* Product header: image + name + status */}
      <div className="flex items-start gap-3">
        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-md bg-surface-elevated shadow-sm ring-1 ring-border-soft/50">
          <ProductImageWithFallback
            src={getFullImageUrl(item.productCoverPhotoPath)}
            alt={item.productName}
            width={56}
            height={56}
            className="h-full w-full object-cover"
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-col items-start gap-1.5 sm:flex-row sm:justify-between sm:gap-3">
            <p className="text-sm font-semibold leading-snug text-text-primary">
              {productHref ? (
                <Link
                  href={productHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-brand"
                >
                  {item.productName}
                </Link>
              ) : (
                item.productName
              )}
            </p>
            {!item.cancelledByCustomer && !item.cancelledBySeller ? (
              <span
                className={`shrink-0 inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold sm:mt-0.5 ${getOrderItemStatusTagClass(metadataStatusValue)}`}
              >
                {metadataStatusLabel}
              </span>
            ) : null}
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-text-muted">
            <span className="rounded bg-surface-muted px-1.5 py-0.5 font-medium">
              {item.quantity} unit{item.quantity > 1 ? "s" : ""}
            </span>
            <span className="text-border-strong">·</span>
            <span className="font-semibold text-text-primary">
              {item.price * item.quantity === 0 ? "FREE" : formatCurrency(item.price * item.quantity)}
            </span>
            {item.quantity > 1 ? <span className="text-[11px]">({formatCurrency(item.price)} each)</span> : null}
            <span className="text-border-strong">·</span>
            {shipmentFee === 0 ? (
              <span className="font-medium text-success">Free Shipping</span>
            ) : (
              <span>Shipment: {formatCurrency(shipmentFee)}</span>
            )}
            {hasHeavyShipmentFee(heavyShipmentFee) ? (
              <>
                <span className="text-border-strong">·</span>
                <span>Heavy fee: {formatCurrency(heavyShipmentFee)}</span>
              </>
            ) : null}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-3 flex w-full flex-wrap items-center gap-2 border-t border-border-soft pt-3">
        <Button
          type="button"
          variant="unstyled"
          onClick={() => void onReorder(item.userProductId, item.quantity, item.productName)}
          disabled={isReordering || isCancelingItem || isCancelingSellerGroup}
          className="inline-flex items-center gap-1 rounded-[8px] bg-accent-strong px-2.5 py-1 text-[11px] font-semibold text-neutral-800 hover:brightness-95 disabled:opacity-70"
        >
          <RotateCcw className="h-3 w-3" />
          {isReordering ? "Adding..." : "Reorder"}
        </Button>
        {isPreShippingCancelableStatus(item.status) ? (
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
            disabled={isCancelingItem || isReordering || isCancelingSellerGroup}
            className="inline-flex items-center gap-1 rounded-[8px] border border-danger/40 bg-danger/15 px-2.5 py-1 text-[11px] font-semibold text-danger hover:bg-danger/25 disabled:opacity-70"
          >
            <XCircle className="h-3 w-3" />
            {isCancelingItem ? "Canceling..." : "Cancel Item"}
          </Button>
        ) : null}
        {trackingLinks.length > 0 ? (
          <Button
            type="button"
            variant="unstyled"
            onClick={() => onOpenTrackingModal({ title: "Tracking links", links: trackingLinks })}
            className="inline-flex items-center gap-1 rounded-[8px] border border-border-strong/70 bg-transparent px-2.5 py-1 text-[11px] font-semibold text-text-secondary hover:bg-surface-muted hover:text-text-primary"
          >
            <ExternalLink className="h-3 w-3" />
            Track
          </Button>
        ) : null}
        {shippingLinks.length > 0 ? (
          <Button
            type="button"
            variant="unstyled"
            onClick={() => onOpenTrackingModal({ title: "Shipping labels", links: shippingLinks })}
            className="inline-flex items-center gap-1 rounded-[8px] border border-border-strong/70 bg-transparent px-2.5 py-1 text-[11px] font-semibold text-text-secondary hover:bg-surface-muted hover:text-text-primary"
          >
            <FileText className="h-3 w-3" />
            Shipping Label
          </Button>
        ) : null}
        {canRequestItemReturn ? (
          <Button
            type="button"
            variant="unstyled"
            onClick={() => onRequestRefund(order, item)}
            disabled={isReordering || isCancelingItem || isCancelingSellerGroup}
            className="inline-flex items-center gap-1 rounded-[8px] border border-brand/40 bg-brand/12 px-2.5 py-1 text-[11px] font-semibold text-brand hover:bg-brand/20 disabled:opacity-70"
          >
            <Undo2 className="h-3 w-3" />
            Request Return
          </Button>
        ) : null}
        {canWriteReview && productId ? (
          <Button
            type="button"
            variant="unstyled"
            onClick={() => onWriteReview({ item, productId, vendorName })}
            disabled={isReviewed}
            className="inline-flex items-center gap-1 rounded-[8px] border border-border-strong/70 bg-transparent px-2.5 py-1 text-[11px] font-semibold text-text-secondary hover:bg-surface-muted hover:text-text-primary disabled:opacity-70"
          >
            <Star className="h-3 w-3" />
            {isReviewed ? "Reviewed" : "Write a Review"}
          </Button>
        ) : null}
      </div>

      {/* Timeline — no extra card border, just a separator */}
      <div className="mt-3 border-t border-border-soft pt-3">
        <FulfillmentTimeline item={item} orderDate={orderDate} />
      </div>
    </div>
  )
}
