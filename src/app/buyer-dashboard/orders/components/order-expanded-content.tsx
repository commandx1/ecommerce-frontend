"use client"

import { ChevronDown, ExternalLink, FileText, RotateCcw, Undo2, XCircle } from "lucide-react"
import { Collapse, CollapseContent, CollapseTrigger } from "@/components/ui/collapse"
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

function getItemAccentClasses(statusValue: string | undefined, cancelledByCustomer: boolean, cancelledBySeller: boolean): string {
  if (cancelledByCustomer || cancelledBySeller) return 'border-l-danger bg-danger/[0.03]'
  const s = (statusValue ?? '').toUpperCase()
  if (s.includes('REJECT')) return 'border-l-danger bg-danger/[0.03]'
  if (s === 'DELIVERED') return 'border-l-success bg-success/[0.03]'
  if (s.includes('RETURN')) return 'border-l-brand bg-brand/[0.03]'
  if (s.includes('SHIP') || s.includes('TRANSIT')) return 'border-l-brand bg-brand/[0.03]'
  return 'border-l-border-strong/50'
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
                <Collapse key={group.sellerId}>
                <section className="overflow-hidden rounded-[8px] border border-border-soft">
                  <CollapseTrigger className="group flex w-full items-center justify-between bg-linear-to-r from-surface-muted/45 to-surface-muted/75 px-4 py-3 transition-colors hover:from-surface-muted/60 hover:to-surface-muted/90 data-[state=open]:border-b data-[state=open]:border-border-soft">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand text-xs font-bold text-primary-foreground shadow-sm">
                        {getSellerFirstTwoLetters(sellerDisplayName)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-text-primary">{sellerDisplayName || "Seller"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-sm font-semibold text-text-primary">{formatCurrency(sellerTotal)}</p>
                        <p className="text-xs text-text-muted">
                          {sellerItemCount} item{sellerItemCount > 1 ? "s" : ""}
                        </p>
                      </div>
                      <ChevronDown className="h-4 w-4 shrink-0 text-text-muted transition-transform duration-200 group-data-[state=open]:rotate-180" />
                    </div>
                  </CollapseTrigger>

                  <CollapseContent>
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
                        item.returnenable === true &&
                        !(typeof item.returnDate === "string" && item.returnDate.trim().length > 0)

                      return (
                        <div
                          key={item.id}
                          className={`rounded-[8px] border border-border-soft border-l-4 ${getItemAccentClasses(metadataStatusValue, Boolean(item.cancelledByCustomer), Boolean(item.cancelledBySeller))} p-4 transition-all hover:shadow-sm`}
                        >
                          {/* Product header: image + name + status */}
                          <div className="flex items-start gap-3">
                            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-md bg-surface-elevated shadow-sm ring-1 ring-border-soft/50">
                              <ProductImageWithFallback
                                src={
                                  getFullImageUrl(item.productCoverPhotoPath) || "/dentypro-product-placeholder.png"
                                }
                                alt={item.productName}
                                width={56}
                                height={56}
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-3">
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
                                    className={`mt-0.5 shrink-0 inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${getOrderItemStatusTagClass(metadataStatusValue)}`}
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
                                  {item.price * item.quantity === 0
                                    ? "FREE"
                                    : formatCurrency(item.price * item.quantity)}
                                </span>
                                {item.quantity > 1 ? (
                                  <span className="text-[11px]">({formatCurrency(item.price)} each)</span>
                                ) : null}
                                <span className="text-border-strong">·</span>
                                {item.shipmentFreeBySeller ? (
                                  <span className="font-medium text-success">Free Shipping</span>
                                ) : (
                                  <span>Shipment: {formatCurrency(getOrderItemShipmentFee(item))}</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="mt-3 flex w-full flex-wrap items-center gap-2 border-t border-border-soft pt-3">
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

                          {/* Timeline — no extra card border, just a separator */}
                          <div className="mt-3 border-t border-border-soft pt-3">
                            <FulfillmentTimeline item={item} orderDate={summary.orderDate} />
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
                            Cancel All Items from <b className="-ml-1">{sellerDisplayName}</b>
                          </>
                        )}
                      </Button>
                    ) : null}
                  </div>
                  </CollapseContent>
                </section>
                </Collapse>
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
