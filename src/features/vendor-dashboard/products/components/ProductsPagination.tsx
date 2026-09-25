"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ProductsPaginationProps {
  pageSize: number
  onPageSizeChange: (size: number) => void
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

/** Page-size select plus the numbered pager, unchanged from the page it was extracted from —
 * this is a bespoke widget (page-size select inline with numbered buttons), not a swap-in for
 * the shared `DashboardPagination` used elsewhere. */
export default function ProductsPagination({
  pageSize,
  onPageSizeChange,
  currentPage,
  totalPages,
  onPageChange,
}: ProductsPaginationProps) {
  return (
    <div className="border-t border-border-soft bg-surface-muted px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-text-secondary">Show</span>
          <Select value={String(pageSize)} onValueChange={(value) => onPageSizeChange(Number(value))}>
            <SelectTrigger
              aria-label="Rows per page"
              className="h-9 w-24 rounded-lg border-border-strong bg-surface-elevated px-3 py-1 text-sm text-text-secondary shadow-none focus-visible:ring-2 focus-visible:ring-brand/40"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-text-secondary">per page</span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 0}
            // Icon-only, so without this the button has no accessible name at all
            // (axe `button-name`, critical).
            aria-label="Previous page"
            className="px-3 py-2 border border-border-strong rounded-lg hover:bg-surface-elevated text-sm font-medium text-text-secondary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Page numbers */}
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNumber: number
            if (totalPages <= 5) {
              pageNumber = i
            } else if (currentPage < 3) {
              pageNumber = i
            } else if (currentPage > totalPages - 3) {
              pageNumber = totalPages - 5 + i
            } else {
              pageNumber = currentPage - 2 + i
            }

            return (
              <button
                key={pageNumber}
                type="button"
                onClick={() => onPageChange(pageNumber)}
                className={`px-3 py-2 rounded-lg text-sm font-medium ${
                  currentPage === pageNumber
                    ? "bg-brand text-white"
                    : "border border-border-strong hover:bg-surface-elevated text-text-secondary"
                }`}
              >
                {pageNumber + 1}
              </button>
            )
          })}

          {totalPages > 5 && currentPage < totalPages - 3 && (
            <>
              <span className="px-2 text-text-muted">...</span>
              <button
                type="button"
                onClick={() => onPageChange(totalPages - 1)}
                className="px-3 py-2 border border-border-strong rounded-lg hover:bg-surface-elevated text-sm font-medium text-text-secondary"
              >
                {totalPages}
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages - 1}
            aria-label="Next page"
            className="px-3 py-2 border border-border-strong rounded-lg hover:bg-surface-elevated text-sm font-medium text-text-secondary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
