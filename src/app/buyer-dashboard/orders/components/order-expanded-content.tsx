"use client"

import { ExternalLink, FileText, RotateCcw, Undo2, XCircle } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import AddressContactInfo from "@/features/checkout/components/AddressContactInfo"
import ProductImageWithFallback from "@/features/products/listing/components/ProductImageWithFallback"
import type { BuyerOrder } from "@/lib/api/buyer-orders"
import { getFullImageUrl } from "@/lib/api/products"
import { isCancelableOrderItemStatus } from "@/lib/constants/order-item-status"
import formatCurrency from "@/lib/helpers/formatCurrency"
import { useBuyerOrdersTableActions, useBuyerOrdersTableSelector } from "../context/buyer-orders-context"
import {
  formatDateTime,
  formatOrderItemStatus,
  getOrderItemShipmentFee,
  getOrderItemStatusTagClass,
  getSellerFirstTwoLetters,
  resolveActiveShippingLinks,
  resolveActiveTrackingLinks,
  resolveOrderItemProductId,
} from "../lib/order-view-utils"
import type { BuyerOrderViewModel } from "../types"
import FulfillmentTimeline from "./fulfillment-timeline"

interface OrderExpandedContentProps {
  order: BuyerOrder
  summary: BuyerOrderViewModel
}

export default function OrderExpandedContent({ order, summary }: OrderExpandedContentProps) {
  const { cancelingItemId, cancelingSellerKey, reorderingItemId } = useBuyerOrdersTableSelector((state) => ({
    cancelingItemId: state.cancelingItemId,
    cancelingSellerKey: state.cancelingSellerKey,
    reorderingItemId: state.reorderingItemId,
  }))
  const { handleReorder, requestCancelAction, requestRefundAction, setTrackingModalLinks } = useBuyerOrdersTableActions()

  return (
    <div className="bg-surface-muted/55 p-6 shadow-inner">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h4 className="text-xl font-semibold text-text-primary">Order Items</h4>
          <p className="text-sm font-medium text-text-muted">
            ({summary.totalQuantity} items from {summary.sellerCount} seller{summary.sellerCount > 1 ? "s" : ""})
          </p>
        </div>
      </div>
      <div className="flex gap-8 rounded-[8px] border border-border-soft bg-surface-elevated p-6 lg:flex-row">
        <div className="flex-1">
          <div className="space-y-6">
            {summary.sellerGroups.map((group) => {
              const sellerDisplayName = [group.sellerName, group.sellerSurname].filter(Boolean).join(" ").trim()
              const sellerTotal = group.orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
              const sellerItemCount = group.orderItems.reduce((sum, item) => sum + item.quantity, 0)
              const cancelableItemIds = group.orderItems
                .filter((item) => isCancelableOrderItemStatus(item.status))
                .map((item) => item.id)
              const hasCancelableItems = cancelableItemIds.length > 0
              const sellerKey = `${order.orderId}:${group.sellerId}`
              const isCancelingSellerGroup = cancelingSellerKey === sellerKey

              return (
                <section key={group.sellerId} className="overflow-hidden rounded-[8px] border border-border-soft">
                  <div className="flex items-center justify-between border-b border-border-soft bg-linear-to-r from-surface-muted/45 to-surface-muted/75 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand text-xs font-bold text-primary-foreground shadow-sm">
                        {getSellerFirstTwoLetters(sellerDisplayName)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-text-primary">{sellerDisplayName || "Seller"}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-text-primary">{formatCurrency(sellerTotal)}</p>
                      <p className="text-xs text-text-muted">
                        {sellerItemCount} item{sellerItemCount > 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 bg-surface-elevated p-3">
                    {group.orderItems.map((item) => {
                      const productId = resolveOrderItemProductId(item)
                      const productHref = productId
                        ? `/products/${encodeURIComponent(productId)}?vendorId=${encodeURIComponent(item.userProductId)}`
                        : null
                      const trackingLinks = resolveActiveTrackingLinks(item)
                      const shippingLinks = resolveActiveShippingLinks(item)
                      const hasReturnFlow = Boolean(item.returnRefundStatus)
                      const metadataStatusValue = hasReturnFlow ? item.returnRefundStatus ?? item.status : item.status
                      const metadataStatusLabel = hasReturnFlow
                        ? `Return ${formatOrderItemStatus(metadataStatusValue)}`
                        : formatOrderItemStatus(metadataStatusValue)
                      const canRequestItemReturn =
                        item.status.toUpperCase() === "DELIVERED" &&
                        !(typeof item.returnDate === "string" && item.returnDate.trim().length > 0)

                      return (
                        <div
                          key={item.id}
                          className="rounded-[8px] border border-border-soft bg-surface-muted/30 p-3 transition-colors hover:border-border-soft"
                        >
                          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_240px]">
                            <div className="flex items-start gap-4">
                              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md bg-surface-elevated shadow-sm">
                                <ProductImageWithFallback
                                  src={
                                    getFullImageUrl(item.productCoverPhotoPath) || "/dentypro-product-placeholder.png"
                                  }
                                  alt={item.productName}
                                  width={48}
                                  height={48}
                                  className="h-full w-full object-cover"
                                />
                              </div>
                              <div className="relative h-full min-w-0 flex-1">
                                <p className="max-w-96 mb-2 text-sm font-medium text-text-primary">
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
                                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-text-muted">
                                  <span className="rounded bg-surface-muted px-2 py-0.5">
                                    Qty: {item.quantity} unit{item.quantity > 1 ? "s" : ""}
                                  </span>
                                  {!item.cancelledByCustomer && !item.cancelledBySeller ? (
                                    <>
                                      <span>•</span>
                                      <span
                                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${getOrderItemStatusTagClass(metadataStatusValue)}`}
                                      >
                                        {metadataStatusLabel}
                                      </span>
                                    </>
                                  ) : null}
                                  <span>•</span>
                                  <span className="font-semibold text-text-primary">
                                    {item.price * item.quantity === 0
                                      ? "FREE"
                                      : formatCurrency(item.price * item.quantity)}
                                  </span>
                                  {item.quantity > 1 ? (
                                    <span className="text-[11px] text-text-muted">
                                      ({formatCurrency(item.price)} each)
                                    </span>
                                  ) : null}
                                  <span>•</span>
                                  {item.shipmentFreeBySeller ? (
                                    <span className="font-semibold text-success">Free Shipping</span>
                                  ) : (
                                    <span className="font-semibold text-text-secondary">
                                      Shipment: {formatCurrency(getOrderItemShipmentFee(item))}
                                    </span>
                                  )}
                                </div>
                                <div className="absolute bottom-0 left-0 flex w-full flex-wrap items-center gap-2 border-t border-border-soft pt-3">
                                  <Button
                                    type="button"
                                    variant="unstyled"
                                    onClick={() =>
                                      void handleReorder(item.userProductId, item.quantity, item.productName)
                                    }
                                    disabled={
                                      reorderingItemId === item.userProductId ||
                                      cancelingItemId === item.id ||
                                      isCancelingSellerGroup
                                    }
                                    className="inline-flex items-center gap-1 rounded-[8px] bg-success px-2.5 py-1 text-[11px] font-semibold text-primary-foreground hover:bg-success/80 disabled:opacity-70"
                                  >
                                    <RotateCcw className="h-3 w-3" />
                                    {reorderingItemId === item.userProductId ? "Adding..." : "Reorder"}
                                  </Button>
                                  {isCancelableOrderItemStatus(item.status) ? (
                                    <Button
                                      type="button"
                                      variant="unstyled"
                                      onClick={() =>
                                        requestCancelAction({
                                          orderItemIds: [item.id],
                                          description: `${item.productName} cancellation request was submitted.`,
                                          options: { cancelingItemId: item.id },
                                        })
                                      }
                                      disabled={
                                        cancelingItemId === item.id ||
                                        reorderingItemId === item.userProductId ||
                                        isCancelingSellerGroup
                                      }
                                      className="inline-flex items-center gap-1 rounded-[8px] border border-danger/40 bg-danger/15 px-2.5 py-1 text-[11px] font-semibold text-danger hover:bg-danger/25 disabled:opacity-70"
                                    >
                                      <XCircle className="h-3 w-3" />
                                      {cancelingItemId === item.id ? "Canceling..." : "Cancel Item"}
                                    </Button>
                                  ) : null}
                                  {trackingLinks.length > 0 ? (
                                    <Button
                                      type="button"
                                      variant="unstyled"
                                      onClick={() =>
                                        setTrackingModalLinks({ title: "Tracking links", links: trackingLinks })
                                      }
                                      className="inline-flex items-center gap-1 rounded-[8px] border border-success/40 bg-success/15 px-2.5 py-1 text-[11px] font-semibold text-success hover:bg-success/25"
                                    >
                                      <ExternalLink className="h-3 w-3" />
                                      Track
                                    </Button>
                                  ) : null}
                                  {shippingLinks.length > 0 ? (
                                    <Button
                                      type="button"
                                      variant="unstyled"
                                      onClick={() =>
                                        setTrackingModalLinks({ title: "Shipping labels", links: shippingLinks })
                                      }
                                      className="inline-flex items-center gap-1 rounded-[8px] border border-brand/40 bg-brand/12 px-2.5 py-1 text-[11px] font-semibold text-brand hover:bg-brand/20"
                                    >
                                      <FileText className="h-3 w-3" />
                                      Shipping Label
                                    </Button>
                                  ) : null}
                                  {canRequestItemReturn ? (
                                    <Button
                                      type="button"
                                      variant="unstyled"
                                      onClick={() => requestRefundAction(order, item)}
                                      disabled={
                                        reorderingItemId === item.userProductId ||
                                        cancelingItemId === item.id ||
                                        isCancelingSellerGroup
                                      }
                                      className="inline-flex items-center gap-1 rounded-[8px] border border-brand/40 bg-brand/12 px-2.5 py-1 text-[11px] font-semibold text-brand hover:bg-brand/20 disabled:opacity-70"
                                    >
                                      <Undo2 className="h-3 w-3" />
                                      Request Return
                                    </Button>
                                  ) : null}
                                </div>
                              </div>
                            </div>
                            <div className="rounded-[8px] border border-border-soft bg-surface-elevated p-3">
                              <FulfillmentTimeline
                                item={item}
                                orderDate={summary.orderDate}
                              />
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <div className="flex items-center justify-between border-t border-border-soft bg-surface-muted/55 px-4 py-3 text-sm text-text-muted">
                    <span>Updated: {formatDateTime(group.orderItems[0]?.updatedDate)}</span>
                    {hasCancelableItems ? (
                      <Button
                        type="button"
                        variant="unstyled"
                        onClick={() =>
                          requestCancelAction({
                            orderItemIds: cancelableItemIds,
                            description: `${sellerDisplayName} items cancellation request was submitted.`,
                            options: { cancelingSellerKey: sellerKey },
                          })
                        }
                        disabled={isCancelingSellerGroup}
                        className="rounded-[8px] border border-danger/40 bg-danger/15 px-2.5 py-1 text-[11px] font-semibold text-danger hover:bg-danger/25 disabled:opacity-70"
                      >
                        <XCircle className="h-3 w-3" />
                        {isCancelingSellerGroup ? (
                          "Canceling items..."
                        ) : (
                          <>
                            Cancel All Items from <b className='-ml-1'>{sellerDisplayName}</b>
                          </>
                        )}
                      </Button>
                    ) : null}
                  </div>
                </section>
              )
            })}
          </div>
        </div>

        <div className="flex w-full flex-col gap-6 lg:w-80">
          <div className="rounded-[8px] border border-border-soft bg-surface-muted/55 p-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-text-muted">
                <span>Subtotal</span>
                <span className="text-text-primary">{formatCurrency(summary.itemTotal)}</span>
              </div>
              <div className="flex justify-between text-text-muted">
                <span>Shipping</span>
                <span className="text-text-primary">
                  {summary.shippingTotal > 0 ? formatCurrency(summary.shippingTotal) : "FREE"}
                </span>
              </div>
              <div className="mt-2 flex justify-between border-t border-border-soft pt-2 font-semibold">
                <span className="text-text-primary">Total</span>
                <span className="text-text-primary">
                  {formatCurrency(summary.totalAmountFromItemPrices + summary.shippingTotal)}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-[8px] border border-border-soft bg-surface-muted/55 p-4">
            <h4 className="mb-3 text-sm font-semibold text-text-primary">Customer Details</h4>
            <p className="text-sm font-semibold text-text-secondary">
              {order.shipmentAddress?.fullName || summary.customerLabel}
            </p>
            <AddressContactInfo
              className="mt-2"
              address={summary.shippingAddress.line}
              phone={order.shipmentAddress?.phoneNumber}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
