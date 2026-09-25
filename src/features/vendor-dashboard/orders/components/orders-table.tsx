"use client"

import type { CellContext, ColumnDef, ExpandedState, OnChangeFn, Row } from "@tanstack/react-table"
import { ChevronDown, ChevronsUpDown, ChevronUp, Loader2 } from "lucide-react"
import { useCallback, useMemo } from "react"
import AutoOrderBadge from "@/app/buyer-dashboard/orders/components/auto-order-badge"
import { formatDateOnly, formatTimeOnly } from "@/app/buyer-dashboard/orders/lib/order-view-utils"
import { Button } from "@/components/ui/button"
import DataTable from "@/components/ui/data-table"
import type { VendorOrder, VendorOrderItem } from "@/lib/api/vendor-orders"
import { isCancelableOrderItemStatus } from "@/lib/constants/order-item-status"
import formatCurrency from "@/lib/helpers/formatCurrency"
import VendorOrderExpandedContent, { getVendorOrderShippingWithHeavyTotal } from "./order-expanded-content"

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

function SortHeaderButton({
  label,
  field,
  sortBy,
  sortDir,
  onSortToggle,
  ariaLabel,
}: {
  label: string
  field: "price" | "quantity" | "createdDate"
  sortBy: "price" | "quantity" | "createdDate"
  sortDir: "asc" | "desc"
  onSortToggle: (field: "price" | "quantity" | "createdDate") => void
  ariaLabel?: string
}) {
  return (
    <Button
      type="button"
      variant="unstyled"
      onClick={() => onSortToggle(field)}
      aria-label={ariaLabel}
      className="inline-flex items-center gap-1 text-xs font-semibold tracking-wider text-text-muted uppercase hover:text-text-secondary"
    >
      {label}
      {sortBy === field ? (
        sortDir === "desc" ? (
          <ChevronDown className="h-3 w-3" />
        ) : (
          <ChevronUp className="h-3 w-3" />
        )
      ) : (
        <ChevronsUpDown className="h-3 w-3 opacity-70" />
      )}
    </Button>
  )
}

// Fully static header content and cells that read only `row.original` (no props/handlers to close
// over), hoisted to module scope so `flexRender` sees the same function identity on every render -
// see the note on `buildOrdersColumns` below for why an unstable identity here is a real hazard,
// not just a style nit.
const BuyerHeader = () => "Buyer"
const ItemsHeader = () => "Items"
const ShippingHeader = () => "Shipping"
const StatusHeader = () => "Status"
const ActionHeader = () => "Action"
const ExpanderHeader = () => null

const renderBuyerCell = ({ row }: CellContext<VendorOrder, unknown>) => (
  <p className="font-medium text-text-primary">
    {row.original.buyerName} {row.original.buyerSurname}
  </p>
)

const renderCreatedCell = ({ row }: CellContext<VendorOrder, unknown>) => (
  <div>
    <p>{formatDateOnly(row.original.orderCreatedDate)}</p>
    <p className="text-xs">{formatTimeOnly(row.original.orderCreatedDate)}</p>
    {row.original.autoOrder ? <AutoOrderBadge isBuyerView={false} /> : null}
  </div>
)

const renderQuantityCell = ({ row }: CellContext<VendorOrder, unknown>) => {
  const quantity = row.original.orderItems.reduce((sum, item) => sum + item.quantity, 0)
  return <p className="font-medium text-text-primary">{quantity}</p>
}

const renderItemsCell = ({ row }: CellContext<VendorOrder, unknown>) => (
  <p className="font-medium text-text-primary">
    {row.original.orderItems.length} item{row.original.orderItems.length > 1 ? "s" : ""}
  </p>
)

const renderPriceCell = ({ row }: CellContext<VendorOrder, unknown>) => {
  const total = row.original.orderItems.reduce((sum, item) => sum + item.totalPrice, 0)
  return <p className="font-semibold text-brand">{formatCurrency(total)}</p>
}

const renderShippingCell = ({ row }: CellContext<VendorOrder, unknown>) => (
  <p>{formatCurrency(getVendorOrderShippingWithHeavyTotal(row.original))}</p>
)

const renderStatusCell = ({ row }: CellContext<VendorOrder, unknown>) => (
  <span
    className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getOrderStatusClasses(row.original.orderStatus)}`}
  >
    {row.original.orderStatus}
  </span>
)

const renderExpanderCell = ({ row }: CellContext<VendorOrder, unknown>) => (
  <Button
    type="button"
    variant="unstyled"
    onClick={() => row.toggleExpanded()}
    aria-label={row.getIsExpanded() ? "Collapse order details" : "Expand order details"}
    className="inline-flex items-center rounded-full border border-border-soft p-1.5! text-text-muted hover:bg-surface-muted hover:text-text-secondary"
  >
    {row.getIsExpanded() ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
  </Button>
)

export interface UseOrdersColumnsParams {
  sortBy: "price" | "quantity" | "createdDate"
  sortDir: "asc" | "desc"
  processingOrderId: string | null
  cancelingOrderId: string | null
  uberProcessedOrderIds: string[]
  onSortToggle: (field: "price" | "quantity" | "createdDate") => void
  onCallUber: (order: VendorOrder) => void
  onRequestCancel: (action: { orderItemIds: string[]; description: string; options?: CancelActionOptions }) => void
}

/**
 * Builds the vendor orders-table column definitions.
 *
 * `flexRender` keys a cell's React element by the *identity* of its `header`/`cell` function, not
 * by the column `id`. A column array rebuilt from scratch on every render is harmless by itself
 * (a handful of cheap object literals), but a `cell`/`header` value that is a fresh inline arrow
 * function every time makes React tear down and remount that cell's whole subtree - including its
 * real DOM node - on every unrelated re-render, which can silently drop a click that lands between
 * two renders (userEvent drives a click as a pointerdown/pointerup sequence, not one synchronous
 * event). Found in S9b on the products table; the "Call Uber" / "Cancel" / expander buttons here
 * are exactly the same shape of hazard, since `processingOrderId`, `cancelingOrderId` and
 * `uberProcessedOrderIds` change on every action click and previously forced a brand new inline
 * `cell` closure for the whole row on each one.
 */
export function useOrdersColumns(params: UseOrdersColumnsParams): Array<ColumnDef<VendorOrder, unknown>> {
  const {
    sortBy,
    sortDir,
    processingOrderId,
    cancelingOrderId,
    uberProcessedOrderIds,
    onSortToggle,
    onCallUber,
    onRequestCancel,
  } = params

  const renderCreatedHeader = useCallback(
    () => (
      <SortHeaderButton
        label="Created"
        field="createdDate"
        sortBy={sortBy}
        sortDir={sortDir}
        onSortToggle={onSortToggle}
      />
    ),
    [sortBy, sortDir, onSortToggle],
  )

  const renderQuantityHeader = useCallback(
    () => (
      <SortHeaderButton
        label="Quantity"
        field="quantity"
        sortBy={sortBy}
        sortDir={sortDir}
        onSortToggle={onSortToggle}
        ariaLabel={`Sort by quantity ${sortBy === "quantity" && sortDir === "desc" ? "ascending" : "descending"}`}
      />
    ),
    [sortBy, sortDir, onSortToggle],
  )

  const renderPriceHeader = useCallback(
    () => (
      <SortHeaderButton
        label="Price"
        field="price"
        sortBy={sortBy}
        sortDir={sortDir}
        onSortToggle={onSortToggle}
        ariaLabel={`Sort by price ${sortBy === "price" && sortDir === "desc" ? "ascending" : "descending"}`}
      />
    ),
    [sortBy, sortDir, onSortToggle],
  )

  const renderActionCell = useCallback(
    ({ row }: CellContext<VendorOrder, unknown>) => {
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
        </div>
      )
    },
    [processingOrderId, cancelingOrderId, uberProcessedOrderIds, onCallUber, onRequestCancel],
  )

  return useMemo<Array<ColumnDef<VendorOrder, unknown>>>(
    () => [
      {
        id: "buyer",
        header: BuyerHeader,
        cell: renderBuyerCell,
        meta: { cellClassName: "px-6 py-4 text-text-secondary", headerClassName: "px-6 py-4" },
      },
      {
        id: "created",
        header: renderCreatedHeader,
        cell: renderCreatedCell,
        meta: { cellClassName: "px-6 py-4 text-text-muted", headerClassName: "px-6 py-4" },
      },
      {
        id: "quantity",
        header: renderQuantityHeader,
        cell: renderQuantityCell,
        meta: { cellClassName: "px-6 py-4 text-text-secondary", headerClassName: "px-6 py-4" },
      },
      {
        id: "items",
        header: ItemsHeader,
        cell: renderItemsCell,
        meta: { cellClassName: "px-6 py-4 text-text-secondary", headerClassName: "px-6 py-4" },
      },
      {
        id: "price",
        header: renderPriceHeader,
        cell: renderPriceCell,
        meta: { cellClassName: "px-6 py-4", headerClassName: "px-6 py-4" },
      },
      {
        id: "shipping",
        header: ShippingHeader,
        cell: renderShippingCell,
        meta: { cellClassName: "px-6 py-4 text-text-secondary", headerClassName: "px-6 py-4" },
      },
      {
        id: "status",
        header: StatusHeader,
        cell: renderStatusCell,
        meta: { cellClassName: "px-6 py-4", headerClassName: "px-6 py-4" },
      },
      {
        id: "action",
        header: ActionHeader,
        cell: renderActionCell,
        meta: { cellClassName: "px-6 py-4", headerClassName: "px-6 py-4" },
      },
      {
        id: "expander",
        header: ExpanderHeader,
        cell: renderExpanderCell,
        meta: { cellClassName: "px-4 py-4 text-right text-text-muted", headerClassName: "w-12 px-4 py-4 text-right" },
      },
    ],
    [renderCreatedHeader, renderQuantityHeader, renderPriceHeader, renderActionCell],
  )
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

  const columns = useOrdersColumns({
    sortBy,
    sortDir,
    processingOrderId,
    cancelingOrderId,
    uberProcessedOrderIds,
    onSortToggle,
    onCallUber,
    onRequestCancel,
  })

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
