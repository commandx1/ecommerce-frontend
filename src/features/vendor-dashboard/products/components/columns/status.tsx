"use client"

import type { CellContext, ColumnDef } from "@tanstack/react-table"
import { HelpCircle } from "lucide-react"
import { useCallback } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import type { ProductReviewStatus } from "@/lib/api/products"
import { getStatusBadgeColor } from "../../lib/status-badge"
import type { EditingDraft, ProductWithDetails } from "../../types"
import type { EditingState } from "./shared"

// Fully static header content: no props, so hoisted to module scope instead of being recreated
// (and, per the note on `useProductColumns` in `index.tsx`, remounted) on every render.
const StatusHeader = () => <div className="text-center">Status</div>

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

export interface UseStatusColumnParams {
  onDraftChange: (patch: Partial<EditingDraft>) => void
  editingStateRef: React.RefObject<EditingState>
}

export function useStatusColumn({
  onDraftChange,
  editingStateRef,
}: UseStatusColumnParams): ColumnDef<ProductWithDetails, unknown> {
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
    [onDraftChange, editingStateRef],
  )

  return {
    id: "status",
    header: StatusHeader,
    cell: renderStatusCell,
    meta: {
      headerClassName: "px-6 py-4 text-center",
      cellClassName: "px-6 py-4 text-center",
    },
  }
}
