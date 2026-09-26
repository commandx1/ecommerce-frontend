"use client"

import { ChevronDown, Download, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Collapse, CollapseContent, CollapseTrigger } from "@/components/ui/collapse"
import type { BuyerOrder, BuyerOrderItem, BuyerOrderSellerGroup } from "@/lib/api/buyer-orders"
import { isPreShippingCancelableStatus } from "@/lib/constants/order-item-status"
import formatCurrency from "@/lib/helpers/formatCurrency"
import { hasHeavyShipmentFee } from "@/lib/helpers/shipping"
import { formatDateTime, getSellerFirstTwoLetters } from "@/lib/orders/order-format"
import type { useBuyerOrdersTableActions } from "../context/buyer-orders-context"
import OrderItemRow from "./order-item-row"

type OrdersTableActions = ReturnType<typeof useBuyerOrdersTableActions>

interface ReviewRequest {
  item: BuyerOrderItem
  productId: string
  vendorName: string
}

interface SellerGroupSectionProps {
  order: BuyerOrder
  group: BuyerOrderSellerGroup
  orderDate: string
  downloadingInvoiceKey: string | null
  cancelingItemId: string | null
  cancelingSellerKey: string | null
  reorderingItemId: string | null
  reviewedItemIds: Set<string>
  onDownloadInvoice: (sellerId: string, sellerKey: string) => void
  onReorder: OrdersTableActions["handleReorder"]
  onRequestCancel: OrdersTableActions["requestCancelAction"]
  onRequestRefund: OrdersTableActions["requestRefundAction"]
  onOpenTrackingModal: OrdersTableActions["setTrackingModalLinks"]
  onWriteReview: (request: ReviewRequest) => void
}

/** One seller's collapsible group within an expanded order: header (invoice + total), its order
 * items, the cancellation-refund summary (once populated), and the cancel-all footer. */
export default function SellerGroupSection({
  order,
  group,
  orderDate,
  downloadingInvoiceKey,
  cancelingItemId,
  cancelingSellerKey,
  reorderingItemId,
  reviewedItemIds,
  onDownloadInvoice,
  onReorder,
  onRequestCancel,
  onRequestRefund,
  onOpenTrackingModal,
  onWriteReview,
}: SellerGroupSectionProps) {
  const sellerDisplayName = [group.sellerName, group.sellerSurname].filter(Boolean).join(" ").trim()
  const vendorName = `${group.sellerName ?? ""} ${group.sellerSurname ?? ""}`.trim()
  const sellerTotal = group.orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const sellerItemCount = group.orderItems.reduce((sum, item) => sum + item.quantity, 0)
  const cancelableItemIds = group.orderItems
    .filter((item) => isPreShippingCancelableStatus(item.status))
    .map((item) => item.id)
  const hasCancelableItems = cancelableItemIds.length > 0
  const sellerKey = `${order.orderId}:${group.sellerId}`
  const isCancelingSellerGroup = cancelingSellerKey === sellerKey

  return (
    <Collapse>
      <section className="overflow-hidden rounded-[8px] border border-border-soft">
        <CollapseTrigger className="group flex w-full flex-col gap-2 bg-linear-to-r from-surface-muted/45 to-surface-muted/75 px-3 py-3 transition-colors hover:from-surface-muted/60 hover:to-surface-muted/90 data-[state=open]:border-b data-[state=open]:border-border-soft md:flex-row md:items-center md:justify-between md:gap-3 sm:px-4">
          <div className="flex items-center justify-between gap-3 md:justify-start">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand text-xs font-bold text-primary-foreground shadow-sm">
                {getSellerFirstTwoLetters(sellerDisplayName)}
              </div>
              <p className="text-sm font-semibold text-text-primary">{sellerDisplayName || "Seller"}</p>
            </div>
            <ChevronDown className="h-4 w-4 shrink-0 text-text-muted transition-transform duration-200 group-data-[state=open]:rotate-180 md:hidden" />
          </div>
          <div className="flex items-center justify-between gap-2 md:ml-auto md:justify-end md:gap-3">
            {/* biome-ignore lint/a11y/useSemanticElements: cannot nest a <button> inside CollapseTrigger's <button> */}
            <span
              role="button"
              tabIndex={0}
              aria-disabled={downloadingInvoiceKey === sellerKey}
              onClick={(event) => {
                event.stopPropagation()
                if (downloadingInvoiceKey === sellerKey) return
                onDownloadInvoice(group.sellerId, sellerKey)
              }}
              onKeyDown={(event) => {
                if (event.key !== "Enter" && event.key !== " ") return
                event.preventDefault()
                event.stopPropagation()
                if (downloadingInvoiceKey === sellerKey) return
                onDownloadInvoice(group.sellerId, sellerKey)
              }}
              className="inline-flex cursor-pointer items-center gap-1 rounded-[8px] border border-border-strong/70 bg-transparent px-2.5 py-1 text-[11px] font-semibold text-text-secondary hover:bg-surface-muted hover:text-text-primary aria-disabled:pointer-events-none aria-disabled:opacity-70"
            >
              <Download className="h-3 w-3" />
              {downloadingInvoiceKey === sellerKey ? "Downloading..." : "Invoice"}
            </span>
            <div className="text-right">
              <p className="text-sm font-semibold text-text-primary">{formatCurrency(sellerTotal)}</p>
              <p className="text-xs text-text-muted">
                {sellerItemCount} item{sellerItemCount > 1 ? "s" : ""}
              </p>
            </div>
            <ChevronDown className="hidden h-4 w-4 shrink-0 text-text-muted transition-transform duration-200 group-data-[state=open]:rotate-180 md:block" />
          </div>
        </CollapseTrigger>

        <CollapseContent>
          <div className="space-y-3 bg-surface-elevated p-3">
            {group.orderItems.map((item) => (
              <OrderItemRow
                key={item.id}
                order={order}
                item={item}
                orderDate={orderDate}
                vendorName={vendorName}
                isReordering={reorderingItemId === item.userProductId}
                isCancelingItem={cancelingItemId === item.id}
                isCancelingSellerGroup={isCancelingSellerGroup}
                isReviewed={item.reviewed === true || reviewedItemIds.has(item.id)}
                onReorder={onReorder}
                onRequestCancel={onRequestCancel}
                onRequestRefund={onRequestRefund}
                onOpenTrackingModal={onOpenTrackingModal}
                onWriteReview={onWriteReview}
              />
            ))}
          </div>

          {/* What the cancellation actually cost. The backend fills these only after a
            cancellation, so they are null on a live order.
            `cancellationHeavyShipmentFeeRefund` follows the same rule. */}
          {typeof group.cancellationShipmentFee === "number" ||
          typeof group.cancellationShipmentRefundFee === "number" ||
          hasHeavyShipmentFee(group.cancellationHeavyShipmentFeeRefund) ? (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border-soft px-3 py-2 text-xs sm:px-4">
              {typeof group.cancellationShipmentFee === "number" ? (
                <span className="text-text-secondary">
                  Shipping charged on cancellation:{" "}
                  <span className="font-semibold text-text-primary">
                    {formatCurrency(group.cancellationShipmentFee)}
                  </span>
                </span>
              ) : null}
              {typeof group.cancellationShipmentRefundFee === "number" ? (
                <span className="text-text-secondary">
                  Shipping refunded:{" "}
                  <span className="font-semibold text-success">
                    {formatCurrency(group.cancellationShipmentRefundFee)}
                  </span>
                </span>
              ) : null}
              {hasHeavyShipmentFee(group.cancellationHeavyShipmentFeeRefund) ? (
                <span className="text-text-secondary">
                  Heavy fee refunded:{" "}
                  <span className="font-semibold text-success">
                    {formatCurrency(group.cancellationHeavyShipmentFeeRefund)}
                  </span>
                </span>
              ) : null}
            </div>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border-soft bg-surface-muted/55 px-3 py-3 text-sm text-text-muted sm:px-4">
            <span>Updated: {formatDateTime(group.orderItems[0]?.updatedDate)}</span>
            {hasCancelableItems ? (
              <Button
                type="button"
                variant="unstyled"
                onClick={() =>
                  onRequestCancel({
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
}
