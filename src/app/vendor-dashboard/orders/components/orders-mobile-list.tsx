"use client"

import { ChevronDown, ChevronsUpDown, ChevronUp, Loader2 } from "lucide-react"
import { formatDateOnly, formatTimeOnly } from "@/app/buyer-dashboard/orders/lib/order-view-utils"
import { Button } from "@/components/ui/button"
import { Collapse, CollapseContent, CollapseTrigger } from "@/components/ui/collapse"
import type { VendorOrder, VendorOrderItem } from "@/lib/api/vendor-orders"
import { isCancelableOrderItemStatus } from "@/lib/constants/order-item-status"
import formatCurrency from "@/lib/helpers/formatCurrency"
import VendorOrderExpandedContent from "./order-expanded-content"

interface CancelActionOptions {
  cancelingItemId?: string
  cancelingOrderId?: string
}

interface VendorOrdersMobileListProps {
  orders: VendorOrder[]
  isLoading: boolean
  sortBy: "price" | "quantity" | "createdDate"
  sortDir: "asc" | "desc"
  expandedOrderId: string | null
  processingOrderId: string | null
  cancelingItemId: string | null
  cancelingOrderId: string | null
  returnActionItemId: string | null
  returnActionType: "confirm" | "reject" | null
  uberProcessedOrderIds: string[]
  onSortToggle: (field: "price" | "quantity" | "createdDate") => void
  onExpandedOrderChange: (orderId: string | null) => void
  onCallUber: (order: VendorOrder) => void
  onRequestCancel: (action: { orderItemIds: string[]; description: string; options?: CancelActionOptions }) => void
  onOpenLabelModal: (links: { shipping: string[]; tracking: string[] }) => void
  onConfirmReturn: (item: VendorOrderItem) => void
  onRejectReturn: (item: VendorOrderItem) => void
}

function getOrderStatusClasses(orderStatus: string): string {
  return orderStatus === "PAYMENT_SUCCESS"
    ? "border border-success/20 bg-success/14 text-success"
    : "border border-border-soft bg-surface-muted text-text-primary"
}

function SortButton({
  label,
  active,
  dir,
  onClick,
}: {
  label: string
  active: boolean
  dir: "asc" | "desc"
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors ${
        active
          ? "border-brand/40 bg-brand/10 text-brand"
          : "border-border-soft text-text-muted hover:text-text-secondary"
      }`}
    >
      {label}
      {active ? (
        dir === "desc" ? (
          <ChevronDown className="h-3 w-3" />
        ) : (
          <ChevronUp className="h-3 w-3" />
        )
      ) : (
        <ChevronsUpDown className="h-2.5 w-2.5 text-text-muted/50" />
      )}
    </button>
  )
}

function OrderCardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-border-soft bg-surface-elevated p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-4 w-28 rounded-full bg-surface-muted" />
          <div className="h-3 w-20 rounded-full bg-surface-muted" />
        </div>
        <div className="h-6 w-24 rounded-full bg-surface-muted" />
      </div>
      <div className="flex items-center justify-between border-t border-border-soft pt-3">
        <div className="h-4 w-24 rounded-full bg-surface-muted" />
        <div className="h-5 w-20 rounded-full bg-surface-muted" />
      </div>
    </div>
  )
}

export default function VendorOrdersMobileList({
  orders,
  isLoading,
  sortBy,
  sortDir,
  expandedOrderId,
  processingOrderId,
  cancelingItemId,
  cancelingOrderId,
  returnActionItemId,
  returnActionType,
  uberProcessedOrderIds,
  onSortToggle,
  onExpandedOrderChange,
  onCallUber,
  onRequestCancel,
  onOpenLabelModal,
  onConfirmReturn,
  onRejectReturn,
}: VendorOrdersMobileListProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 4 }).map((_, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton list
          <OrderCardSkeleton key={index} />
        ))}
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="rounded-2xl border border-border-soft bg-surface-elevated p-8 text-center text-sm text-text-muted">
        No orders found.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="scrollbar-hide -mx-4 flex flex-nowrap items-center gap-2 overflow-x-auto px-4 pb-1">
        <span className="shrink-0 text-xs font-semibold tracking-wider text-text-muted uppercase">Sort by</span>
        <SortButton
          label="Created"
          active={sortBy === "createdDate"}
          dir={sortDir}
          onClick={() => onSortToggle("createdDate")}
        />
        <SortButton
          label="Quantity"
          active={sortBy === "quantity"}
          dir={sortDir}
          onClick={() => onSortToggle("quantity")}
        />
        <SortButton label="Price" active={sortBy === "price"} dir={sortDir} onClick={() => onSortToggle("price")} />
      </div>

      {orders.map((order) => {
        const isOpen = expandedOrderId === order.orderId
        const quantity = order.orderItems.reduce((sum, item) => sum + item.quantity, 0)
        const total = order.orderItems.reduce((sum, item) => sum + item.totalPrice, 0)
        const canCallUber = order.orderItems.some(
          (item) => item.status === "WAITING_FOR_UBER_DIRECT" || item.status === "UBER_ERROR",
        )
        const cancelableOrderItemIds = order.orderItems
          .filter(
            (item) => isCancelableOrderItemStatus(item.status) && !item.cancelledByCustomer && !item.cancelledBySeller,
          )
          .map((item) => item.id)
        const hasCancelableOrderItems = cancelableOrderItemIds.length > 0
        const isUberProcessed = uberProcessedOrderIds.includes(order.orderId)

        return (
          <Collapse
            key={order.orderId}
            open={isOpen}
            onOpenChange={(next) => onExpandedOrderChange(next ? order.orderId : null)}
            className={`overflow-hidden rounded-2xl border bg-surface-elevated transition-colors ${
              isOpen ? "border-brand/30 bg-surface-muted/40" : "border-border-soft"
            }`}
          >
            <CollapseTrigger className="flex w-full flex-col gap-4 p-4 text-left sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold text-text-primary">
                    {order.buyerName} {order.buyerSurname}
                  </p>
                  <p className="mt-0.5 text-xs text-text-muted">
                    {formatDateOnly(order.orderCreatedDate)} · {formatTimeOnly(order.orderCreatedDate)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap ${getOrderStatusClasses(order.orderStatus)}`}
                  >
                    {order.orderStatus}
                  </span>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border-soft text-text-muted">
                    {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2 border-t border-border-soft pt-3">
                <div className="flex min-w-0 flex-col gap-1">
                  <p className="text-sm font-semibold text-text-primary">
                    {quantity} unit{quantity > 1 ? "s" : ""}
                  </p>
                  <p className="text-xs text-text-muted">
                    {order.orderItems.length} item{order.orderItems.length > 1 ? "s" : ""}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-brand">{formatCurrency(total)}</p>
                  <p className="text-xs text-text-muted">+{formatCurrency(order.totalShippingCost ?? 0)} shipping</p>
                </div>
              </div>
            </CollapseTrigger>

            {hasCancelableOrderItems || canCallUber ? (
              <div className="flex flex-wrap items-center gap-2 border-t border-border-soft px-4 py-3 sm:px-5">
                {hasCancelableOrderItems ? (
                  <Button
                    type="button"
                    variant="unstyled"
                    onClick={() =>
                      onRequestCancel({
                        orderItemIds: cancelableOrderItemIds,
                        description: "Cancellation request for this order's items was submitted.",
                        options: { cancelingOrderId: order.orderId },
                      })
                    }
                    disabled={cancelingOrderId === order.orderId}
                    className="inline-flex items-center rounded-full border border-danger/25 bg-danger/10 px-4 py-1.5 text-xs font-semibold text-danger transition-colors hover:bg-danger/15 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {cancelingOrderId === order.orderId ? (
                      <span className="inline-flex items-center gap-1">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Canceling...
                      </span>
                    ) : (
                      "Cancel"
                    )}
                  </Button>
                ) : null}
                <Button
                  type="button"
                  variant="unstyled"
                  onClick={() => onCallUber(order)}
                  disabled={!canCallUber || isUberProcessed || processingOrderId === order.orderId}
                  className="inline-flex items-center rounded-full bg-brand px-4 py-1.5 text-xs font-semibold text-primary-foreground transition-colors hover:bg-brand-strong disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-text-muted"
                >
                  {processingOrderId === order.orderId ? (
                    <span className="inline-flex items-center gap-1">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Processing...
                    </span>
                  ) : (
                    "Call Uber"
                  )}
                </Button>
              </div>
            ) : null}

            <CollapseContent>
              <div className="border-t border-border-soft">
                <VendorOrderExpandedContent
                  order={order}
                  orderDate={formatDateOnly(order.orderCreatedDate)}
                  cancelingItemId={cancelingItemId}
                  cancelingOrderId={cancelingOrderId}
                  returnActionItemId={returnActionItemId}
                  returnActionType={returnActionType}
                  onOpenLabelModal={onOpenLabelModal}
                  onRequestCancel={onRequestCancel}
                  onConfirmReturn={onConfirmReturn}
                  onRejectReturn={onRejectReturn}
                />
              </div>
            </CollapseContent>
          </Collapse>
        )
      })}
    </div>
  )
}
