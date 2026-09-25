"use client"

import { useState } from "react"
import { showToast } from "@/components/ui/Toast"
import WriteReviewModal from "@/features/products/product-detail/components/WriteReviewModal"
import type { BuyerOrder, BuyerOrderItem } from "@/lib/api/buyer-orders"
import { invoicesAPI } from "@/lib/api/invoices"
import { useBuyerOrdersTableActions, useBuyerOrdersTableSelector } from "../context/buyer-orders-context"
import type { BuyerOrderViewModel } from "../types"
import OrderSummaryPanel from "./order-summary-panel"
import SellerGroupSection from "./seller-group-section"

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
  const { handleReorder, requestCancelAction, requestRefundAction, setTrackingModalLinks } =
    useBuyerOrdersTableActions()
  const [downloadingInvoiceKey, setDownloadingInvoiceKey] = useState<string | null>(null)
  const [reviewingItem, setReviewingItem] = useState<{
    item: BuyerOrderItem
    productId: string
    vendorName: string
  } | null>(null)
  const [reviewedItemIds, setReviewedItemIds] = useState<Set<string>>(() => new Set())

  const handleDownloadInvoice = async (sellerId: string, sellerKey: string) => {
    setDownloadingInvoiceKey(sellerKey)
    try {
      const { blob, fileName } = await invoicesAPI.downloadInvoice(order.orderId, sellerId)
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = fileName
      a.click()
      URL.revokeObjectURL(url)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to download invoice"
      showToast.error(msg)
    } finally {
      setDownloadingInvoiceKey(null)
    }
  }

  const reviewingItemId = reviewingItem?.item.id

  return (
    <>
      <div className="bg-surface-muted/55 p-3 shadow-inner sm:p-6">
        <div className="mb-4 flex flex-wrap items-center gap-x-2 gap-y-1">
          <h4 className="text-lg font-semibold text-text-primary sm:text-xl">Order Items</h4>
          <p className="text-sm font-medium text-text-muted">
            ({summary.totalQuantity} items from {summary.sellerCount} seller{summary.sellerCount > 1 ? "s" : ""})
          </p>
        </div>
        <div className="flex flex-col gap-6 rounded-[8px] border-0 md:border border-border-soft md:bg-surface-elevated md:p-6 lg:flex-row lg:gap-8">
          <div className="min-w-0 flex-1">
            <div className="space-y-6">
              {summary.sellerGroups.map((group) => (
                <SellerGroupSection
                  key={group.sellerId}
                  order={order}
                  group={group}
                  orderDate={summary.orderDate}
                  downloadingInvoiceKey={downloadingInvoiceKey}
                  cancelingItemId={cancelingItemId}
                  cancelingSellerKey={cancelingSellerKey}
                  reorderingItemId={reorderingItemId}
                  reviewedItemIds={reviewedItemIds}
                  onDownloadInvoice={(sellerId, sellerKey) => void handleDownloadInvoice(sellerId, sellerKey)}
                  onReorder={handleReorder}
                  onRequestCancel={requestCancelAction}
                  onRequestRefund={requestRefundAction}
                  onOpenTrackingModal={setTrackingModalLinks}
                  onWriteReview={setReviewingItem}
                />
              ))}
            </div>
          </div>

          <OrderSummaryPanel order={order} summary={summary} />
        </div>
      </div>

      {reviewingItem ? (
        <WriteReviewModal
          isOpen
          productId={reviewingItem.productId}
          userProductId={reviewingItem.item.userProductId}
          productName={reviewingItem.item.productName}
          vendorName={reviewingItem.vendorName}
          onClose={() => setReviewingItem(null)}
          onSuccess={() => {
            if (reviewingItemId) {
              setReviewedItemIds((prev) => new Set(prev).add(reviewingItemId))
            }
          }}
        />
      ) : null}
    </>
  )
}
