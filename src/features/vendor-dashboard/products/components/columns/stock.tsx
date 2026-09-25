"use client"

import type { CellContext, ColumnDef } from "@tanstack/react-table"
import { useCallback } from "react"
import type { UserProductSortBy } from "@/lib/api/products"
import { cn } from "@/lib/utils"
import { parseWholeNumber } from "../../lib/inline-edit"
import { getStockColor } from "../../lib/status-badge"
import type { EditingDraft, ProductWithDetails, ViewMode } from "../../types"
import type { EditingState } from "./shared"
import { SortHeader } from "./shared"

export interface UseStockColumnParams {
  viewMode: ViewMode
  sortField: UserProductSortBy | null
  sortDirection: "asc" | "desc"
  onSort: (field: UserProductSortBy) => void
  onDraftChange: (patch: Partial<EditingDraft>) => void
  editingStateRef: React.RefObject<EditingState>
}

export function useStockColumn({
  viewMode,
  sortField,
  sortDirection,
  onSort,
  onDraftChange,
  editingStateRef,
}: UseStockColumnParams): ColumnDef<ProductWithDetails, unknown> {
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
    [onDraftChange, editingStateRef],
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

  return {
    id: "stock",
    header: renderStockHeader,
    cell: renderStockCell,
    meta: {
      headerClassName: "px-6 py-4 text-center",
      cellClassName: "px-6 py-4 text-center",
    },
  }
}
