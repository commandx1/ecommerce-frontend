"use client"

import type { ColumnDef, Row } from "@tanstack/react-table"
import { ChevronDown, ChevronsUpDown, ChevronUp, Package, Store } from "lucide-react"
import { Button } from "@/components/ui/button"
import DataTable from "@/components/ui/data-table"
import type { BuyerOrder } from "@/lib/api/buyer-orders"
import formatCurrency from "@/lib/helpers/formatCurrency"
import { useBuyerOrdersTableActions, useBuyerOrdersTableSelector } from "../context/buyer-orders-context"
import { buildBuyerOrderViewModel } from "../lib/order-view-utils"
import AutoOrderBadge from "./auto-order-badge"
import OrderExpandedContent from "./order-expanded-content"

export default function OrdersTable() {
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

  const orderColumns: Array<ColumnDef<BuyerOrder, unknown>> = [
    {
      id: "date",
      header: () => (
        <Button
          type="button"
          variant="unstyled"
          onClick={() => handleSort("createdDate")}
          className="inline-flex items-center gap-1 text-xs font-semibold tracking-wider text-text-muted uppercase hover:text-text-secondary"
        >
          Date
          {sortField === "createdDate" ? (
            sortDir === "desc" ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronUp className="h-3 w-3" />
            )
          ) : (
            <ChevronsUpDown className="h-2.5 w-2.5 text-text-muted/50" />
          )}
        </Button>
      ),
      cell: ({ row }) => {
        const summary = getSummary(row.original)
        return (
          <>
            <p>{summary.orderDate}</p>
            <p className="text-xs">{summary.orderTime}</p>
            {row.original.autoOrder ? <AutoOrderBadge /> : null}
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
      id: "netTotal",
      header: () => (
        <Button
          type="button"
          variant="unstyled"
          onClick={() => handleSort("totalPrice")}
          className="inline-flex items-center gap-1 text-xs font-semibold tracking-wider text-text-muted uppercase hover:text-text-secondary"
        >
          Net Total
          {sortField === "totalPrice" ? (
            sortDir === "desc" ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronUp className="h-3 w-3" />
            )
          ) : (
            <ChevronsUpDown className="h-2.5 w-2.5 text-text-muted/50" />
          )}
        </Button>
      ),
      cell: ({ row }) => {
        const summary = getSummary(row.original)
        return <p>{formatCurrency(summary.money.netTotal)}</p>
      },
      meta: {
        cellClassName: "px-6 py-4 text-right font-semibold text-text-primary",
        headerClassName: "px-6 py-4 text-right",
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

  const renderExpandedOrderContent = (row: Row<BuyerOrder>) => {
    const order = row.original
    const summary = getSummary(order)

    return <OrderExpandedContent order={order} summary={summary} />
  }

  return (
    <DataTable
      columns={orderColumns}
      data={filteredOrders}
      expanded={expandedState}
      lastColumnSkeletonCircle
      getRowClassName={(row) =>
        `cursor-pointer transition-colors hover:bg-surface-muted/55 ${row.getIsExpanded() ? "bg-surface-muted/40" : ""}`
      }
      getRowId={(order) => order.orderId}
      isLoading={isLoading}
      loadingText="Loading orders..."
      noRowsText="No orders found."
      onExpandedChange={handleExpandedChange}
      renderExpandedContent={renderExpandedOrderContent}
    />
  )
}
