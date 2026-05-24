"use client"

import { Button } from "@/components/ui/button"

interface OrdersPaginationProps {
  currentPage: number
  onPageChange: (page: number) => void
  pageSize: number
  totalElements: number
  totalPages: number
}

export default function OrdersPagination({
  currentPage,
  onPageChange,
  pageSize,
  totalElements,
  totalPages,
}: OrdersPaginationProps) {
  return (
    <div className="flex items-center justify-between border-t border-border-soft p-4 text-sm text-text-muted">
      <div>
        {totalElements > 0
          ? `Showing ${currentPage * pageSize + 1} to ${Math.min((currentPage + 1) * pageSize, totalElements)} of ${totalElements.toLocaleString()} results`
          : "Showing 0 results"}
      </div>
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="unstyled"
          onClick={() => onPageChange(Math.max(0, currentPage - 1))}
          disabled={currentPage === 0}
          className="rounded border border-border-soft px-3 py-1 hover:bg-surface-muted/55 disabled:opacity-50"
        >
          Prev
        </Button>
        {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
          const pageNumber = i
          return (
            <Button
              key={pageNumber}
              type="button"
              variant="unstyled"
              onClick={() => onPageChange(pageNumber)}
              className={`rounded border px-3 py-1 ${
                currentPage === pageNumber
                  ? "border-brand/35 bg-brand/15 font-medium text-brand"
                  : "border-border-soft hover:bg-surface-muted/55"
              }`}
            >
              {pageNumber + 1}
            </Button>
          )
        })}
        {totalPages > 3 ? <span className="px-2">...</span> : null}
        <Button
          type="button"
          variant="unstyled"
          onClick={() => onPageChange(Math.min(totalPages - 1, currentPage + 1))}
          disabled={currentPage >= totalPages - 1}
          className="rounded border border-border-soft px-3 py-1 hover:bg-surface-muted/55 disabled:opacity-50"
        >
          Next
        </Button>
      </div>
    </div>
  )
}
