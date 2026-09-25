"use client"

import type { CellContext, ColumnDef } from "@tanstack/react-table"
import { ArrowDown, ArrowUp, Check, Edit, Eye, FileEdit, HelpCircle, Loader2, Trash2, X } from "lucide-react"
import Image from "next/image"
import { useCallback, useRef } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import type { ProductReviewStatus, UserProductSortBy } from "@/lib/api/products"
import { formatNumber } from "@/lib/helpers/format"
import formatCurrency from "@/lib/helpers/formatCurrency"
import { cn } from "@/lib/utils"
import { isDiscountOutOfRange, parseWholeNumber } from "../lib/inline-edit"
import { getStatusBadgeColor, getStockColor } from "../lib/status-badge"
import type { EditingDraft, ProductWithDetails, ViewMode } from "../types"

function getReviewBadge(reviewStatus?: ProductReviewStatus) {
  if (!reviewStatus || reviewStatus.approved === true) return null

  if (reviewStatus.approved === false) {
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full border border-danger/20 bg-danger/14 text-danger">
        Rejected
        {reviewStatus.rejectedReason ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <HelpCircle className="h-3.5 w-3.5 shrink-0 cursor-help text-danger" />
            </TooltipTrigger>
            <TooltipContent>{reviewStatus.rejectedReason}</TooltipContent>
          </Tooltip>
        ) : null}
      </span>
    )
  }

  return (
    <span className="px-3 py-1 text-xs font-medium rounded-full border border-warning/20 bg-warning/14 text-warning">
      Pending Review
    </span>
  )
}

function SortHeader({
  label,
  field,
  sortField,
  sortDirection,
  disabled,
  onSort,
}: {
  label: string
  field: UserProductSortBy
  sortField: UserProductSortBy | null
  sortDirection: "asc" | "desc"
  disabled: boolean
  onSort: (field: UserProductSortBy) => void
}) {
  return (
    <div className="flex justify-center">
      <button
        type="button"
        onClick={() => onSort(field)}
        disabled={disabled}
        className="flex items-center space-x-1 hover:text-brand transition-colors disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span>{label}</span>
        {sortField === field ? (
          sortDirection === "asc" ? (
            <ArrowUp className="w-4 h-4" />
          ) : (
            <ArrowDown className="w-4 h-4" />
          )
        ) : (
          <div className="flex flex-col -space-y-1.5 w-4 h-4">
            <ArrowUp className="w-3 h-3 text-text-muted" />
            <ArrowDown className="w-3 h-3 text-text-muted" />
          </div>
        )}
      </button>
    </div>
  )
}

// Fully static header content: no props, so these are hoisted to module scope instead of being
// recreated (and, per the note on `useProductColumns`, remounted) on every render.
const ProductHeader = () => "Product"
const DiscountHeader = () => <div className="flex justify-center">Discount</div>
const ShipmentFeeHeader = () => <div className="flex justify-center">Shipment Fee</div>
const HeavyShippingSurchargeHeader = () => <div className="flex justify-center">Heavy Shipping Fee</div>
const StatusHeader = () => <div className="text-center">Status</div>
const ActionsHeader = () => <div className="text-center">Actions</div>

// Pure formatting cells (only read `row.original`), also hoisted for the same reason.
const renderPeriodicSellCountCell = ({ row }: CellContext<ProductWithDetails, unknown>) => (
  <span className="text-sm text-text-secondary">
    {row.original.periodicSellCount != null ? formatNumber(row.original.periodicSellCount) : 0}
  </span>
)

const renderPeriodicGrossRevenueCell = ({ row }: CellContext<ProductWithDetails, unknown>) => (
  <span className="text-sm font-medium text-text-primary">
    {formatCurrency(row.original.periodicGrossRevenue ?? 0)}
  </span>
)

interface EditingState {
  editingProductId: string | null
  editingDraft: EditingDraft | null
  savingProductId: string | null
  canSaveDraft: boolean
}

export interface UseProductColumnsParams {
  viewMode: ViewMode
  sortField: UserProductSortBy | null
  sortDirection: "asc" | "desc"
  onSort: (field: UserProductSortBy) => void
  editingProductId: string | null
  editingDraft: EditingDraft | null
  savingProductId: string | null
  canSaveDraft: boolean
  onDraftChange: (patch: Partial<EditingDraft>) => void
  onEditStart: (product: ProductWithDetails) => void
  onEditSave: (product: ProductWithDetails) => void
  onEditCancel: () => void
  onDelete: (userProductId: string, productName: string) => void
  onViewDetails: (product: ProductWithDetails) => void
  onResubmit: (product: ProductWithDetails) => void
  imageFallbacks: Record<string, boolean>
  onImageError: (productId: string) => void
}

/**
 * Builds the products-table column definitions.
 *
 * Every `header`/`cell` is either hoisted to module scope (fully static, or pure functions of
 * `row` alone) or wrapped in its own `useCallback`. This matters more than it looks: react-table's
 * `flexRender` treats a plain function as a component type, keyed by that function's *identity*.
 * The array itself is rebuilt on every render either way (cheap - it is a handful of object
 * literals), but if the `header`/`cell` value inside one of those literals were a fresh inline
 * arrow function every time, React would tear down and remount that cell's subtree — including
 * its real DOM node — on every unrelated re-render of the page, which can silently drop a click or
 * keystroke that lands between two renders (observed via `userEvent`, which drives pointer/input
 * events as a sequence rather than one synchronous `fireEvent`). All of the interactive cells
 * (price/discount/stock/fee inputs, status, actions) additionally read the *current* editing state
 * off a ref rather than closing over it directly, so their `useCallback` dependency stays limited
 * to the handful of caller-supplied callbacks and never changes on every keystroke.
 */
export function useProductColumns(params: UseProductColumnsParams): Array<ColumnDef<ProductWithDetails, unknown>> {
  const {
    viewMode,
    sortField,
    sortDirection,
    onSort,
    editingProductId,
    editingDraft,
    savingProductId,
    canSaveDraft,
    onDraftChange,
    onEditStart,
    onEditSave,
    onEditCancel,
    onDelete,
    onViewDetails,
    onResubmit,
    imageFallbacks,
    onImageError,
  } = params

  const editingStateRef = useRef<EditingState>({ editingProductId, editingDraft, savingProductId, canSaveDraft })
  editingStateRef.current = { editingProductId, editingDraft, savingProductId, canSaveDraft }

  const renderProductCell = useCallback(
    ({ row }: CellContext<ProductWithDetails, unknown>) => {
      const product = row.original
      return (
        <div className="flex items-center min-w-72">
          <div className="w-12 h-12 min-w-12 min-h-12 max-w-12 max-h-12 overflow-hidden bg-surface-elevated rounded-lg border border-border-soft flex items-center justify-center mr-3">
            <Image
              src={imageFallbacks[product.id] || !product.image ? "/dentypro-product-placeholder.png" : product.image}
              alt={product.productName}
              width={40}
              height={40}
              className={cn(
                "w-full h-full object-contain",
                imageFallbacks[product.id] || !product.image ? "scale-110" : "",
              )}
              onError={() => onImageError(product.id)}
            />
          </div>
          <div className="font-medium text-text-primary">{product.productName}</div>
        </div>
      )
    },
    [imageFallbacks, onImageError],
  )

  const renderPriceCell = useCallback(
    (info: CellContext<ProductWithDetails, unknown>) => {
      const product = info.row.original
      const { editingProductId, editingDraft, savingProductId } = editingStateRef.current
      const isEditing = editingProductId === product.id
      const isSaving = savingProductId === product.id
      const draftPrice = editingDraft?.price ?? ""

      // A discount rewrites `price` and keeps the pre-discount value in `oldPrice`.
      const oldPrice = product.oldPrice ?? 0
      const hasDiscount = (product.discount ?? 0) > 0 && oldPrice > product.price

      return (
        <div className="text-sm font-semibold text-brand">
          {isEditing ? (
            <input
              type="number"
              min={0}
              step="0.01"
              value={draftPrice}
              onChange={(event) => onDraftChange({ price: event.target.value })}
              className="h-9 w-28 rounded-lg border border-border-strong bg-surface px-3 text-sm font-semibold text-brand focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand/40"
              disabled={isSaving}
            />
          ) : hasDiscount ? (
            <div className="flex flex-wrap items-baseline justify-center gap-x-1.5 gap-y-0.5">
              <span className="text-xs font-medium text-text-muted line-through">{formatCurrency(oldPrice)}</span>
              <span>{formatCurrency(product.price)}</span>
            </div>
          ) : (
            formatCurrency(product.price)
          )}
        </div>
      )
    },
    [onDraftChange],
  )

  const renderDiscountCell = useCallback(
    (info: CellContext<ProductWithDetails, unknown>) => {
      const product = info.row.original
      const { editingProductId, editingDraft, savingProductId } = editingStateRef.current
      const isEditing = editingProductId === product.id
      const isSaving = savingProductId === product.id
      const draftDiscount = editingDraft?.discount ?? ""
      const discountOutOfRangeError = isDiscountOutOfRange(draftDiscount)

      return (
        <div className="text-sm font-medium text-text-primary">
          {isEditing ? (
            <div className="flex flex-col items-center gap-1">
              <input
                type="number"
                min={0}
                max={100}
                step="0.01"
                value={draftDiscount}
                onChange={(event) => onDraftChange({ discount: event.target.value })}
                className={cn(
                  "h-9 w-24 rounded-lg border bg-surface px-3 text-sm font-medium text-text-primary focus:outline-none focus:ring-2",
                  discountOutOfRangeError
                    ? "border-danger focus:border-transparent focus:ring-danger/40"
                    : "border-border-strong focus:border-transparent focus:ring-brand/40",
                )}
                disabled={isSaving}
              />
              {discountOutOfRangeError && <span className="text-xs text-danger">Must be 0–100</span>}
            </div>
          ) : (
            // `discount` is a percentage (0-100) on the backend, not an amount.
            `${Number((product.discount ?? 0).toFixed(2))}%`
          )}
        </div>
      )
    },
    [onDraftChange],
  )

  const renderStockCell = useCallback(
    (info: CellContext<ProductWithDetails, unknown>) => {
      const product = info.row.original
      const { editingProductId, editingDraft, savingProductId } = editingStateRef.current
      const isEditing = editingProductId === product.id
      const isSaving = savingProductId === product.id
      const draftStock = editingDraft?.stock ?? ""
      const stockHasFractionError = draftStock.trim() !== "" && parseWholeNumber(draftStock) === null

      return isEditing ? (
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center justify-center gap-2">
            <input
              type="number"
              min={0}
              step={1}
              value={draftStock}
              onChange={(event) => onDraftChange({ stock: event.target.value })}
              className={cn(
                "h-9 w-24 rounded-lg border bg-surface px-3 text-sm font-medium text-text-primary focus:outline-none focus:ring-2",
                stockHasFractionError
                  ? "border-danger focus:border-transparent focus:ring-danger/40"
                  : "border-border-strong focus:border-transparent focus:ring-brand/40",
              )}
              disabled={isSaving}
            />
            <span className="text-xs text-text-muted">units</span>
          </div>
          {stockHasFractionError && <span className="text-xs text-danger">Whole numbers only</span>}
        </div>
      ) : (
        <div className="flex items-center justify-center">
          <span className={`text-sm font-medium ${getStockColor(product.stock)}`}>{product.stock}</span>
          <span className="ml-2 text-xs text-text-muted">units</span>
        </div>
      )
    },
    [onDraftChange],
  )

  const renderShipmentFeeCell = useCallback(
    (info: CellContext<ProductWithDetails, unknown>) => {
      const product = info.row.original
      const { editingProductId, editingDraft, savingProductId } = editingStateRef.current
      const isEditing = editingProductId === product.id
      const isSaving = savingProductId === product.id
      const draftShipmentFee = editingDraft?.shipmentFee ?? ""

      return (
        <div className="text-sm font-medium text-text-primary">
          {isEditing ? (
            <input
              type="number"
              min={0}
              step="0.01"
              value={draftShipmentFee}
              onChange={(event) => onDraftChange({ shipmentFee: event.target.value })}
              className="h-9 w-24 rounded-lg border border-border-strong bg-surface px-3 text-sm font-medium text-text-primary focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand/40"
              disabled={isSaving}
            />
          ) : (
            formatCurrency(product.shipmentFee ?? 0)
          )}
        </div>
      )
    },
    [onDraftChange],
  )

  const renderHeavyShippingSurchargeCell = useCallback(
    (info: CellContext<ProductWithDetails, unknown>) => {
      const product = info.row.original
      const { editingProductId, editingDraft, savingProductId } = editingStateRef.current
      const isEditing = editingProductId === product.id
      const isSaving = savingProductId === product.id
      const draftHeavyShippingSurcharge = editingDraft?.heavyShippingSurcharge ?? ""

      return (
        <div className="text-sm font-medium text-text-primary">
          {isEditing ? (
            <input
              type="number"
              min={0}
              step="0.01"
              value={draftHeavyShippingSurcharge}
              onChange={(event) => onDraftChange({ heavyShippingSurcharge: event.target.value })}
              className="h-9 w-24 rounded-lg border border-border-strong bg-surface px-3 text-sm font-medium text-text-primary focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand/40"
              disabled={isSaving}
            />
          ) : (
            formatCurrency(product.heavyShippingSurcharge ?? 0)
          )}
        </div>
      )
    },
    [onDraftChange],
  )

  const renderStatusCell = useCallback(
    ({ row }: CellContext<ProductWithDetails, unknown>) => {
      const product = row.original
      const { editingProductId, editingDraft, savingProductId } = editingStateRef.current
      const isEditing = editingProductId === product.id
      const isSaving = savingProductId === product.id
      const draftActive = editingDraft?.active ?? (product.active ? "active" : "inactive")

      return isEditing ? (
        <Select
          value={draftActive}
          onValueChange={(value) => onDraftChange({ active: value === "active" ? "active" : "inactive" })}
          disabled={isSaving}
        >
          <SelectTrigger
            aria-label={`Status for ${product.productName}`}
            className="h-9 w-32 rounded-lg border-border-strong bg-surface-elevated px-3 text-sm shadow-none focus:ring-2 focus:ring-brand/40"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      ) : product.reviewStatus && product.reviewStatus.approved !== true ? (
        <div className="flex flex-col items-center gap-1">{getReviewBadge(product.reviewStatus)}</div>
      ) : (
        <div className="flex flex-col items-center gap-1">
          <span
            className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(product.active ? "Active" : "Inactive")}`}
          >
            {product.active ? "Active" : "Inactive"}
          </span>
        </div>
      )
    },
    [onDraftChange],
  )

  const renderActionsCell = useCallback(
    ({ row }: CellContext<ProductWithDetails, unknown>) => {
      const product = row.original
      const { editingProductId, savingProductId, canSaveDraft } = editingStateRef.current
      const isEditing = editingProductId === product.id
      const isSaving = savingProductId === product.id

      const reviewApproved = product.reviewStatus?.approved
      const isRejected = reviewApproved === false
      const isPending = product.reviewStatus != null && reviewApproved === null
      const showReviewEdit = isRejected || isPending

      return (
        <div className="flex items-center justify-center space-x-2">
          <button
            type="button"
            onClick={() => onViewDetails(product)}
            className="rounded-lg p-2 text-text-secondary transition-colors hover:bg-surface-muted"
            title="View details"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => (isEditing ? onEditSave(product) : onEditStart(product))}
            disabled={isSaving || (isEditing && !canSaveDraft)}
            className="rounded-lg p-2 text-brand transition-colors hover:bg-surface-muted disabled:opacity-50"
            title={isEditing ? "Save" : "Edit"}
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isEditing ? (
              <Check className="w-4 h-4" />
            ) : (
              <Edit className="w-4 h-4" />
            )}
          </button>
          {isEditing && (
            <button
              type="button"
              onClick={onEditCancel}
              disabled={isSaving}
              className="rounded-lg p-2 text-red-600 transition-colors hover:bg-surface-muted disabled:opacity-50"
              title="Cancel"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          {showReviewEdit && (
            <button
              type="button"
              onClick={() => onResubmit(product)}
              disabled={isPending}
              className="rounded-lg p-2 text-brand transition-colors hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-40"
              title={
                isPending
                  ? "Product is pending review and cannot be edited yet"
                  : "Edit rejected product and resubmit for review"
              }
            >
              <FileEdit className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => onDelete(product.id, product.productName)}
            disabled={isSaving}
            className="rounded-lg p-2 text-danger transition-colors hover:bg-danger/10"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    },
    [onViewDetails, onEditSave, onEditStart, onEditCancel, onResubmit, onDelete],
  )

  const renderPriceHeader = useCallback(
    () => (
      <SortHeader
        label="Price"
        field="PRICE"
        sortField={sortField}
        sortDirection={sortDirection}
        disabled={viewMode === "review"}
        onSort={onSort}
      />
    ),
    [sortField, sortDirection, viewMode, onSort],
  )

  const renderStockHeader = useCallback(
    () => (
      <SortHeader
        label="Stock"
        field="STOCK"
        sortField={sortField}
        sortDirection={sortDirection}
        disabled={viewMode === "review"}
        onSort={onSort}
      />
    ),
    [sortField, sortDirection, viewMode, onSort],
  )

  const renderPeriodicSellCountHeader = useCallback(
    () => (
      <SortHeader
        label="Qty Sold"
        field="PERIODIC_SELL_COUNT"
        sortField={sortField}
        sortDirection={sortDirection}
        disabled={viewMode === "review"}
        onSort={onSort}
      />
    ),
    [sortField, sortDirection, viewMode, onSort],
  )

  const renderPeriodicGrossRevenueHeader = useCallback(
    () => (
      <SortHeader
        label="Sales"
        field="PERIODIC_GROSS_REVENUE"
        sortField={sortField}
        sortDirection={sortDirection}
        disabled={viewMode === "review"}
        onSort={onSort}
      />
    ),
    [sortField, sortDirection, viewMode, onSort],
  )

  return [
    {
      id: "product",
      header: ProductHeader,
      cell: renderProductCell,
      meta: {
        headerClassName: "w-80 px-6 py-4",
        cellClassName: "px-6 py-4",
      },
    },
    {
      id: "price",
      header: renderPriceHeader,
      cell: renderPriceCell,
      meta: {
        headerClassName: "px-6 py-4 text-center",
        cellClassName: "px-6 py-4 text-center",
      },
    },
    {
      id: "discount",
      header: DiscountHeader,
      cell: renderDiscountCell,
      meta: {
        headerClassName: "px-6 py-4 text-center",
        cellClassName: "px-6 py-4 text-center",
      },
    },
    {
      id: "shipmentFee",
      header: ShipmentFeeHeader,
      cell: renderShipmentFeeCell,
      meta: {
        headerClassName: "px-6 py-4 text-center",
        cellClassName: "px-6 py-4 text-center",
      },
    },
    {
      id: "heavyShippingSurcharge",
      header: HeavyShippingSurchargeHeader,
      cell: renderHeavyShippingSurchargeCell,
      meta: {
        headerClassName: "px-6 py-4 text-center",
        cellClassName: "px-6 py-4 text-center",
      },
    },
    {
      id: "stock",
      header: renderStockHeader,
      cell: renderStockCell,
      meta: {
        headerClassName: "px-6 py-4 text-center",
        cellClassName: "px-6 py-4 text-center",
      },
    },
    {
      id: "periodicSellCount",
      header: renderPeriodicSellCountHeader,
      cell: renderPeriodicSellCountCell,
      meta: {
        headerClassName: "px-6 py-4 text-center",
        cellClassName: "px-6 py-4 text-center",
      },
    },
    {
      id: "periodicGrossRevenue",
      header: renderPeriodicGrossRevenueHeader,
      cell: renderPeriodicGrossRevenueCell,
      meta: {
        headerClassName: "px-6 py-4 text-center",
        cellClassName: "px-6 py-4 text-center",
      },
    },
    {
      id: "status",
      header: StatusHeader,
      cell: renderStatusCell,
      meta: {
        headerClassName: "px-6 py-4 text-center",
        cellClassName: "px-6 py-4 text-center",
      },
    },
    {
      id: "actions",
      header: ActionsHeader,
      cell: renderActionsCell,
      meta: {
        headerClassName: "px-6 py-4 text-center",
        cellClassName: "px-6 py-4 text-center",
      },
    },
  ]
}
