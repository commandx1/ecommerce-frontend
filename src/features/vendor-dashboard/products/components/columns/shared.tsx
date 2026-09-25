"use client"

import { ArrowDown, ArrowUp } from "lucide-react"
import type { UserProductSortBy } from "@/lib/api/products"
import type { EditingDraft } from "../../types"

/** Shared editing-state snapshot every interactive cell reads through a ref (see `index.tsx`) so
 * their `useCallback`-wrapped cell renderers keep a stable identity across keystrokes. */
export interface EditingState {
  editingProductId: string | null
  editingDraft: EditingDraft | null
  savingProductId: string | null
  canSaveDraft: boolean
}

export function SortHeader({
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
