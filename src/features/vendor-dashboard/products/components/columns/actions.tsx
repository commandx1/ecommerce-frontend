"use client"

import type { CellContext, ColumnDef } from "@tanstack/react-table"
import { Check, Edit, Eye, FileEdit, Loader2, Trash2, X } from "lucide-react"
import { useCallback } from "react"
import type { ProductWithDetails } from "../../types"
import type { EditingState } from "./shared"

// Fully static header content: no props, so hoisted to module scope instead of being recreated
// (and, per the note on `useProductColumns` in `index.tsx`, remounted) on every render.
const ActionsHeader = () => <div className="text-center">Actions</div>

export interface UseActionsColumnParams {
  onEditStart: (product: ProductWithDetails) => void
  onEditSave: (product: ProductWithDetails) => void
  onEditCancel: () => void
  onDelete: (userProductId: string, productName: string) => void
  onViewDetails: (product: ProductWithDetails) => void
  onResubmit: (product: ProductWithDetails) => void
  editingStateRef: React.RefObject<EditingState>
}

export function useActionsColumn({
  onEditStart,
  onEditSave,
  onEditCancel,
  onDelete,
  onViewDetails,
  onResubmit,
  editingStateRef,
}: UseActionsColumnParams): ColumnDef<ProductWithDetails, unknown> {
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
    [onViewDetails, onEditSave, onEditStart, onEditCancel, onResubmit, onDelete, editingStateRef],
  )

  return {
    id: "actions",
    header: ActionsHeader,
    cell: renderActionsCell,
    meta: {
      headerClassName: "px-6 py-4 text-center",
      cellClassName: "px-6 py-4 text-center",
    },
  }
}
