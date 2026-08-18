"use client"

import type { ColumnDef, ExpandedState, OnChangeFn, Row } from "@tanstack/react-table"
import { ChevronDown, ChevronsUpDown, ChevronUp, Loader2 } from "lucide-react"
import { useMemo } from "react"
import AutoOrderBadge from "@/app/buyer-dashboard/orders/components/auto-order-badge"
import { formatDateOnly, formatTimeOnly } from "@/app/buyer-dashboard/orders/lib/order-view-utils"
import { Button } from "@/components/ui/button"
import DataTable from "@/components/ui/data-table"
import type { VendorOrder, VendorOrderItem } from "@/lib/api/vendor-orders"
import { isCancelableOrderItemStatus } from "@/lib/constants/order-item-status"
import formatCurrency from "@/lib/helpers/formatCurrency"
import VendorOrderExpandedContent from "./order-expanded-content"

interface CancelActionOptions {
  cancelingItemId?: string
  cancelingOrderId?: string
}

interface VendorOrdersTableProps {
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

export default function VendorOrdersTable({
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
}: VendorOrdersTableProps) {
  const expandedState = useMemo<ExpandedState>(() => {
    return expandedOrderId ? { [expandedOrderId]: true } : {}
  }, [expandedOrderId])

  const handleExpandedChange: OnChangeFn<ExpandedState> = (updater) => {
    const next = typeof updater === "function" ? updater(expandedState) : updater
    if (next === true) {
      onExpandedOrderChange(null)
      return
    }
    const expandedRowIds = Object.keys(next).filter((rowId) => Boolean(next[rowId]))
    const nextExpandedId = expandedRowIds[expandedRowIds.length - 1] ?? null
    onExpandedOrderChange(nextExpandedId)
  }

  const columns: Array<ColumnDef<VendorOrder, unknown>> = [
    {
      id: "buyer",
      header: () => "Buyer",
      cell: ({ row }) => (
        <p className="font-medium text-text-primary">
          {row.original.buyerName} {row.original.buyerSurname}
        </p>
      ),
      meta: {
        cellClassName: "px-6 py-4 text-text-secondary",
        headerClassName: "px-6 py-4",
      },
    },
    {
      id: "created",
      header: () => (
        <Button
          type="button"
          variant="unstyled"
          onClick={() => onSortToggle("createdDate")}
          className="inline-flex items-center gap-1 text-xs font-semibold tracking-wider text-text-muted uppercase hover:text-text-secondary"
        >
          Created
          {sortBy === "createdDate" ? (
            sortDir === "desc" ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronUp className="h-3 w-3" />
            )
          ) : (
            <ChevronsUpDown className="h-3 w-3 opacity-70" />
          )}
        </Button>
      ),
      cell: ({ row }) => (
        <>
          <p>{formatDateOnly(row.original.orderCreatedDate)}</p>
          <p className="text-xs">{formatTimeOnly(row.original.orderCreatedDate)}</p>
          {row.original.autoOrder ? <AutoOrderBadge isBuyerView={false} /> : null}
        </>
      ),
      meta: {
        cellClassName: "px-6 py-4 text-text-muted",
        headerClassName: "px-6 py-4",
      },
    },
    {
      id: "quantity",
      header: () => (
        <Button
          type="button"
          variant="unstyled"
          onClick={() => onSortToggle("quantity")}
          className="inline-flex w-full items-center justify-end gap-1 text-xs font-semibold tracking-wider text-text-muted uppercase hover:text-text-secondary"
          aria-label={`Sort by quantity ${sortBy === "quantity" && sortDir === "desc" ? "ascending" : "descending"}`}
        >
          Quantity
          {sortBy === "quantity" ? (
            sortDir === "desc" ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronUp className="h-3 w-3" />
            )
          ) : (
            <ChevronsUpDown className="h-3 w-3 opacity-70" />
          )}
        </Button>
      ),
      cell: ({ row }) => {
        const quantity = row.original.orderItems.reduce((sum, item) => sum + item.quantity, 0)
        return <p className="font-medium text-text-primary">{quantity}</p>
      },
      meta: {
        cellClassName: "border-l-2 border-border-soft px-6 py-4 text-right text-text-secondary",
        headerClassName: "border-l-2 border-border-soft px-6 py-4 text-right",
      },
    },
    {
      id: "items",
      header: () => "Items",
      cell: ({ row }) => (
        <p className="font-medium text-text-primary">
          {row.original.orderItems.length} item{row.original.orderItems.length > 1 ? "s" : ""}
        </p>
      ),
      meta: {
        cellClassName: "px-6 py-4 text-right text-text-secondary",
        headerClassName: "px-6 py-4 text-right",
      },
    },
    {
      id: "price",
      header: () => (
        <Button
          type="button"
          variant="unstyled"
          onClick={() => onSortToggle("price")}
          className="inline-flex w-full items-center justify-end gap-1 text-xs font-semibold tracking-wider text-text-muted uppercase hover:text-text-secondary"
          aria-label={`Sort by price ${sortBy === "price" && sortDir === "desc" ? "ascending" : "descending"}`}
        >
          Price
          {sortBy === "price" ? (
            sortDir === "desc" ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronUp className="h-3 w-3" />
            )
          ) : (
            <ChevronsUpDown className="h-3 w-3 opacity-70" />
          )}
        </Button>
      ),
      cell: ({ row }) => {
        const total = row.original.orderItems.reduce((sum, item) => sum + item.totalPrice, 0)
        return <p className="font-semibold text-brand">{formatCurrency(total)}</p>
      },
      meta: {
        cellClassName: "border-l-2 border-border-soft px-6 py-4 text-right",
        headerClassName: "border-l-2 border-border-soft px-6 py-4 text-right",
      },
    },
    {
      id: "shipping",
      header: () => "Shipping",
      cell: ({ row }) => <p>{formatCurrency(row.original.totalShippingCost ?? 0)}</p>,
      meta: {
        cellClassName: "px-6 py-4 text-right text-text-secondary",
        headerClassName: "px-6 py-4 text-right",
      },
    },
    {
      id: "status",
      header: () => "Status",
      cell: ({ row }) => (
        <span
          className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getOrderStatusClasses(row.original.orderStatus)}`}
        >
          {row.original.orderStatus}
        </span>
      ),
      meta: {
        cellClassName: "border-l-2 border-border-soft px-6 py-4",
        headerClassName: "border-l-2 border-border-soft px-6 py-4",
      },
    },
    {
      id: "action",
      header: () => "Action",
      cell: ({ row }) => {
        const order = row.original
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
          <div className="flex justify-end gap-2">
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
              className="rounded-full truncate bg-brand px-4 py-1.5 text-xs font-semibold text-primary-foreground transition-colors hover:bg-brand-strong disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-text-muted"
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
        )
      },
      meta: {
        cellClassName: "border-l-2 border-border-soft px-6 py-4 text-right",
        headerClassName: "border-l-2 border-border-soft px-6 py-4 text-right",
      },
    },
    {
      id: "expander",
      header: () => null,
      cell: ({ row }) => (
        <Button
          type="button"
          variant="unstyled"
          onClick={() => row.toggleExpanded()}
          className="inline-flex items-center rounded-full border border-border-soft p-1.5! text-text-muted hover:bg-surface-muted hover:text-text-secondary"
        >
          {row.getIsExpanded() ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      ),
      meta: {
        cellClassName: "px-4 py-4 text-right text-text-muted",
        headerClassName: "w-12 px-4 py-4 text-right",
      },
    },
  ]

  const renderExpandedContent = (row: Row<VendorOrder>) => {
    return (
      <VendorOrderExpandedContent
        order={row.original}
        orderDate={formatDateOnly(row.original.orderCreatedDate)}
        cancelingItemId={cancelingItemId}
        cancelingOrderId={cancelingOrderId}
        returnActionItemId={returnActionItemId}
        returnActionType={returnActionType}
        onOpenLabelModal={onOpenLabelModal}
        onRequestCancel={onRequestCancel}
        onConfirmReturn={onConfirmReturn}
        onRejectReturn={onRejectReturn}
      />
    )
  }

  return (
    <DataTable
      columns={columns}
      data={orders}
      expanded={expandedState}
      getRowClassName={(row) =>
        `cursor-pointer transition-colors hover:bg-surface-muted/55 ${row.getIsExpanded() ? "bg-surface-muted/40" : ""}`
      }
      getRowId={(order) => order.orderId}
      isLoading={isLoading}
      loadingText="Loading orders..."
      noRowsText="No orders found."
      onExpandedChange={handleExpandedChange}
      renderExpandedContent={renderExpandedContent}
    />
  )
}
