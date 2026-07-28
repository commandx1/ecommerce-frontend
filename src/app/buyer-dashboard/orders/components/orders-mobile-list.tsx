"use client"

import { ChevronDown, ChevronsUpDown, ChevronUp, Package, Store } from "lucide-react"
import { Collapse, CollapseContent, CollapseTrigger } from "@/components/ui/collapse"
import type { BuyerOrder } from "@/lib/api/buyer-orders"
import formatCurrency from "@/lib/helpers/formatCurrency"
import { useBuyerOrdersTableActions, useBuyerOrdersTableSelector } from "../context/buyer-orders-context"
import { buildBuyerOrderViewModel, getOrderStatusBadgeClasses, getOrderStatusLabel } from "../lib/order-view-utils"
import OrderExpandedContent from "./order-expanded-content"

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
      className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
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
          <div className="h-3 w-16 rounded-full bg-surface-muted" />
          <div className="h-4 w-28 rounded-full bg-surface-muted" />
        </div>
        <div className="h-6 w-20 rounded-full bg-surface-muted" />
      </div>
      <div className="mb-4 h-4 w-40 rounded-full bg-surface-muted" />
      <div className="flex items-center justify-between border-t border-border-soft pt-3">
        <div className="h-4 w-24 rounded-full bg-surface-muted" />
        <div className="h-5 w-20 rounded-full bg-surface-muted" />
      </div>
    </div>
  )
}

export default function OrdersMobileList() {
  const { sortField, sortDir, expandedState, filteredOrders, isLoading, summariesByOrderId } =
    useBuyerOrdersTableSelector((state) => ({
      sortField: state.sortField,
      sortDir: state.sortDir,
      expandedState: state.expandedState,
      filteredOrders: state.filteredOrders,
      isLoading: state.isLoading,
      summariesByOrderId: state.summariesByOrderId,
    }))

  const { handleSort, handleExpandedChange } = useBuyerOrdersTableActions()

  const getSummary = (order: BuyerOrder) => summariesByOrderId.get(order.orderId) ?? buildBuyerOrderViewModel(order)

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

  if (filteredOrders.length === 0) {
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
          label="Date"
          active={sortField === "createdDate"}
          dir={sortDir}
          onClick={() => handleSort("createdDate")}
        />
        <SortButton
          label="Net Total"
          active={sortField === "totalPrice"}
          dir={sortDir}
          onClick={() => handleSort("totalPrice")}
        />
      </div>

      {filteredOrders.map((order) => {
        const summary = getSummary(order)
        const isOpen = expandedState === true || Boolean((expandedState as Record<string, boolean>)[order.orderId])

        return (
          <Collapse
            key={order.orderId}
            open={isOpen}
            onOpenChange={(next) => handleExpandedChange({ [order.orderId]: next })}
            className={`overflow-hidden rounded-2xl border bg-surface-elevated transition-colors ${
              isOpen ? "border-brand/30 bg-surface-muted/40" : "border-border-soft"
            }`}
          >
            <CollapseTrigger className="flex w-full flex-col gap-4 p-4 text-left sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-base font-semibold text-text-primary">{summary.orderDate}</p>
                  <p className="mt-0.5 text-xs text-text-muted">{summary.orderTime}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${getOrderStatusBadgeClasses(summary.uiStatus)}`}
                  >
                    {getOrderStatusLabel(summary.uiStatus)}
                  </span>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border-soft text-text-muted">
                    {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <Store className="h-3.5 w-3.5 shrink-0 text-brand" />
                <span className="truncate text-sm font-medium text-text-primary">
                  {summary.sellerSummary.primarySeller}
                </span>
                {summary.sellerSummary.moreCount > 0 ? (
                  <span className="shrink-0 text-xs text-text-muted">+{summary.sellerSummary.moreCount} more</span>
                ) : null}
              </div>

              <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2 border-t border-border-soft pt-3">
                <div className="flex min-w-0 flex-col gap-1">
                  <p className="inline-flex items-center gap-1.5 text-text-primary">
                    <Package className="h-3.5 w-3.5 shrink-0 text-brand" />
                    <span className="text-sm font-semibold">
                      {summary.totalQuantity} item{summary.totalQuantity > 1 ? "s" : ""}
                    </span>
                  </p>
                  <p className="text-xs text-text-muted">{summary.lineItemCount} line item(s)</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-text-primary">{formatCurrency(summary.money.netTotal)}</p>
                  {summary.shippingTotal > 0 ? (
                    <p className="text-xs text-text-muted">+{formatCurrency(summary.shippingTotal)} shipping</p>
                  ) : (
                    <p className="text-xs font-medium text-success">Free shipping</p>
                  )}
                </div>
              </div>
            </CollapseTrigger>

            <CollapseContent>
              <div className="border-t border-border-soft">
                <OrderExpandedContent order={order} summary={summary} />
              </div>
            </CollapseContent>
          </Collapse>
        )
      })}
    </div>
  )
}
