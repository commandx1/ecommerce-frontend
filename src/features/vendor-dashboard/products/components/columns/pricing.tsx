"use client"

import type { CellContext, ColumnDef } from "@tanstack/react-table"
import { useCallback } from "react"
import type { UserProductSortBy } from "@/lib/api/products"
import formatCurrency from "@/lib/helpers/formatCurrency"
import { cn } from "@/lib/utils"
import { isDiscountOutOfRange } from "../../lib/inline-edit"
import type { EditingDraft, ProductWithDetails, ViewMode } from "../../types"
import type { EditingState } from "./shared"
import { SortHeader } from "./shared"

// Fully static header content: no props, so hoisted to module scope instead of being recreated
// (and, per the note on `useProductColumns` in `index.tsx`, remounted) on every render.
const DiscountHeader = () => <div className="flex justify-center">Discount</div>
const ShipmentFeeHeader = () => <div className="flex justify-center">Shipment Fee</div>
const HeavyShippingSurchargeHeader = () => <div className="flex justify-center">Heavy Shipping Fee</div>

export interface UsePricingColumnsParams {
  viewMode: ViewMode
  sortField: UserProductSortBy | null
  sortDirection: "asc" | "desc"
  onSort: (field: UserProductSortBy) => void
  onDraftChange: (patch: Partial<EditingDraft>) => void
  editingStateRef: React.RefObject<EditingState>
}

export function usePricingColumns({
  viewMode,
  sortField,
  sortDirection,
  onSort,
  onDraftChange,
  editingStateRef,
}: UsePricingColumnsParams): Array<ColumnDef<ProductWithDetails, unknown>> {
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
    [onDraftChange, editingStateRef],
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
    [onDraftChange, editingStateRef],
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
    [onDraftChange, editingStateRef],
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
    [onDraftChange, editingStateRef],
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

  return [
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
  ]
}
