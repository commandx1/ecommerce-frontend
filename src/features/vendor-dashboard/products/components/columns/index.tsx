"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { useRef } from "react"
import type { UserProductSortBy } from "@/lib/api/products"
import type { EditingDraft, ProductWithDetails, ViewMode } from "../../types"
import { useActionsColumn } from "./actions"
import { useIdentityColumn } from "./identity"
import { useMetricsColumns } from "./metrics"
import { usePricingColumns } from "./pricing"
import type { EditingState } from "./shared"
import { useStatusColumn } from "./status"
import { useStockColumn } from "./stock"

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
 * Builds the products-table column definitions. Every `header`/`cell` is hoisted to module scope or
 * wrapped in `useCallback`: `flexRender` keys a cell by its function's identity, so a fresh inline
 * arrow would remount the cell's DOM on every re-render and can drop a click or keystroke. The
 * interactive cells read the current editing state off a ref (`editingStateRef`, shared with every
 * sub-hook below), so their callbacks never change per keystroke.
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

  const identityColumn = useIdentityColumn({ imageFallbacks, onImageError })
  const pricingColumns = usePricingColumns({
    viewMode,
    sortField,
    sortDirection,
    onSort,
    onDraftChange,
    editingStateRef,
  })
  const stockColumn = useStockColumn({ viewMode, sortField, sortDirection, onSort, onDraftChange, editingStateRef })
  const metricsColumns = useMetricsColumns({ viewMode, sortField, sortDirection, onSort })
  const statusColumn = useStatusColumn({ onDraftChange, editingStateRef })
  const actionsColumn = useActionsColumn({
    onEditStart,
    onEditSave,
    onEditCancel,
    onDelete,
    onViewDetails,
    onResubmit,
    editingStateRef,
  })

  return [identityColumn, ...pricingColumns, stockColumn, ...metricsColumns, statusColumn, actionsColumn]
}
