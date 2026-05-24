"use client"

import type { ColumnDef, ExpandedState, OnChangeFn, Row } from "@tanstack/react-table"
import { ChevronDown, ChevronUp, Package, Store, Truck } from "lucide-react"
import { Button } from "@/components/ui/button"
import DataTable from "@/components/ui/data-table"
import type { BuyerOrder, BuyerOrderTrackingLink } from "@/lib/api/buyer-orders"
import formatCurrency from "@/lib/helpers/formatCurrency"
import {
  buildBuyerOrderViewModel,
  getOrderStatusBadgeClasses,
  getOrderStatusLabel,
  getPaymentViewStatusClasses,
  getPaymentViewStatusLabel,
} from "../lib/order-view-utils"
import type { BuyerOrderViewModel, PendingCancelAction } from "../types"
import OrderExpandedContent from "./order-expanded-content"

interface OrdersTableProps {
  cancelingItemId: string | null
  cancelingSellerKey: string | null
  dateSortDir: "asc" | "desc"
  expandedState: ExpandedState
  isLoading: boolean
  onDateSortToggle: () => void
  onExpandedChange: OnChangeFn<ExpandedState>
  onOpenTrackingLinks: (links: BuyerOrderTrackingLink[]) => void
  onReorder: (userProductId: string, quantity: number, productName: string) => Promise<void>
  onRequestCancel: (action: PendingCancelAction) => void
  orders: BuyerOrder[]
  reorderingItemId: string | null
  summariesByOrderId: Map<string, BuyerOrderViewModel>
}

export default function OrdersTable({
  cancelingItemId,
  cancelingSellerKey,
  dateSortDir,
  expandedState,
  isLoading,
  onDateSortToggle,
  onExpandedChange,
  onOpenTrackingLinks,
  onReorder,
  onRequestCancel,
  orders,
  reorderingItemId,
  summariesByOrderId,
}: OrdersTableProps) {
  const getSummary = (order: BuyerOrder) => summariesByOrderId.get(order.orderId) ?? buildBuyerOrderViewModel(order)

  const orderColumns: Array<ColumnDef<BuyerOrder, unknown>> = [
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
        cellClassName: "px-4 py-4 text-text-muted",
        headerClassName: "w-12 px-4 py-4",
      },
    },
    {
      id: "date",
      header: () => (
        <Button
          type="button"
          variant="unstyled"
          onClick={onDateSortToggle}
          className="inline-flex items-center gap-1 text-xs font-semibold tracking-wider text-text-muted uppercase hover:text-text-secondary"
          aria-label={`Sort by date ${dateSortDir === "desc" ? "ascending" : "descending"}`}
        >
          Date
          {dateSortDir === "desc" ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
        </Button>
      ),
      cell: ({ row }) => {
        const summary = getSummary(row.original)
        return (
          <>
            <p>{summary.orderDate}</p>
            <p className="text-xs">{summary.orderTime}</p>
          </>
        )
      },
      meta: {
        cellClassName: "px-6 py-4 text-text-muted",
        headerClassName: "px-6 py-4",
      },
    },
    {
      id: "seller",
      header: () => "Seller / Store",
      cell: ({ row }) => {
        const summary = getSummary(row.original)
        return (
          <>
            <p className="inline-flex items-center gap-1.5 font-medium text-text-primary">
              <Store className="h-3.5 w-3.5 text-brand" />
              {summary.sellerSummary.primarySeller}
            </p>
            {summary.sellerSummary.moreCount > 0 ? (
              <p className="text-xs text-text-muted">+{summary.sellerSummary.moreCount} more seller(s)</p>
            ) : null}
          </>
        )
      },
    },
    {
      id: "items",
      header: () => "Items",
      cell: ({ row }) => {
        const summary = getSummary(row.original)
        return (
          <div>
            <p className="inline-flex items-center gap-1.5 text-text-primary">
              <Package className="h-3.5 w-3.5 text-brand" />
              <span className="font-semibold">
                {summary.totalQuantity} item{summary.totalQuantity > 1 ? "s" : ""}
              </span>
            </p>
            <p className="text-xs text-text-muted">{summary.lineItemCount} line item(s)</p>
          </div>
        )
      },
    },
    {
      id: "paymentMethod",
      header: () => "Payment Method",
      cell: ({ row }) => {
        const summary = getSummary(row.original)
        return (
          <>
            <p className="font-medium text-text-primary">{summary.payment.title}</p>
            {summary.payment.detail ? <p className="text-xs text-text-muted">{summary.payment.detail}</p> : null}
          </>
        )
      },
      meta: {
        cellClassName: "border-l-2 border-border-soft px-6 py-4 text-text-secondary",
        headerClassName: "border-l-2 border-border-soft px-6 py-4",
      },
    },
    {
      id: "paymentStatus",
      header: () => "Payment Status",
      cell: ({ row }) => {
        const summary = getSummary(row.original)
        return (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${getPaymentViewStatusClasses(summary.paymentStatus)}`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {getPaymentViewStatusLabel(summary.paymentStatus)}
          </span>
        )
      },
    },
    {
      id: "shipmentStatus",
      header: () => "Shipment Status",
      cell: ({ row }) => {
        const summary = getSummary(row.original)
        return (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${getOrderStatusBadgeClasses(summary.uiStatus)}`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                summary.uiStatus === "delivered"
                  ? "bg-success"
                  : summary.uiStatus === "shipped"
                    ? "bg-brand"
                    : "bg-warning"
              }`}
            />
            {getOrderStatusLabel(summary.uiStatus)}
          </span>
        )
      },
      meta: {
        cellClassName: "border-l-2 border-border-soft px-6 py-4",
        headerClassName: "border-l-2 border-border-soft px-6 py-4",
      },
    },
    {
      id: "tracking",
      header: () => "Tracking",
      cell: ({ row }) => {
        const summary = getSummary(row.original)
        return summary.trackingCount > 0 ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-brand/35 bg-brand/10 px-2.5 py-1 text-xs font-medium text-brand">
            <Truck className="h-3 w-3" />
            {summary.trackingCount} link{summary.trackingCount > 1 ? "s" : ""}
          </span>
        ) : (
          <span className="text-xs text-text-muted">No tracking yet</span>
        )
      },
    },
    {
      id: "netTotal",
      header: () => "Net Total",
      cell: ({ row }) => {
        const summary = getSummary(row.original)
        return <p>{formatCurrency(summary.money.netTotal)}</p>
      },
      meta: {
        cellClassName: "border-l-2 border-border-soft px-6 py-4 text-right font-semibold text-text-primary",
        headerClassName: "border-l-2 border-border-soft px-6 py-4 text-right",
      },
    },
    {
      id: "shipmentFee",
      header: () => "Shipment Fee",
      cell: ({ row }) => {
        const summary = getSummary(row.original)
        return <p className="text-3sm">{formatCurrency(summary.shippingTotal)}</p>
      },
      meta: {
        cellClassName: "px-6 py-4 text-right font-medium text-text-primary",
        headerClassName: "px-6 py-4 text-right",
      },
    },
  ]

  const renderExpandedOrderContent = (row: Row<BuyerOrder>) => {
    const order = row.original
    const summary = getSummary(order)

    return (
      <OrderExpandedContent
        cancelingItemId={cancelingItemId}
        cancelingSellerKey={cancelingSellerKey}
        onOpenTrackingLinks={onOpenTrackingLinks}
        onReorder={onReorder}
        onRequestCancel={onRequestCancel}
        order={order}
        reorderingItemId={reorderingItemId}
        summary={summary}
      />
    )
  }

  return (
    <DataTable
      columns={orderColumns}
      data={orders}
      expanded={expandedState}
      getRowClassName={(row) =>
        `cursor-pointer transition-colors hover:bg-surface-muted/55 ${row.getIsExpanded() ? "bg-surface-muted/40" : ""}`
      }
      getRowId={(order) => order.orderId}
      isLoading={isLoading}
      loadingText="Loading orders..."
      minTableWidthClassName="min-w-[1380px]"
      noRowsText="No orders found."
      onExpandedChange={onExpandedChange}
      renderExpandedContent={renderExpandedOrderContent}
    />
  )
}
