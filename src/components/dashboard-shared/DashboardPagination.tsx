"use client"

import { Button } from "@/components/ui/button"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { cn } from "@/lib/utils"

interface DashboardPaginationProps {
  currentPage: number // 0-indexed
  totalPages: number
  totalElements: number
  pageSize: number
  onPageChange: (page: number) => void
  className?: string
}

function getPageNumbers(currentPage: number, totalPages: number): (number | "...")[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i)
  }

  const pages = new Set([0, totalPages - 1])
  for (let i = Math.max(0, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
    pages.add(i)
  }

  const sorted = Array.from(pages).sort((a, b) => a - b)
  const result: (number | "...")[] = []

  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && (sorted[i] as number) - (sorted[i - 1] as number) > 1) {
      result.push("...")
    }
    result.push(sorted[i])
  }

  return result
}

export default function DashboardPagination({
  currentPage,
  totalPages,
  totalElements,
  pageSize,
  onPageChange,
  className,
}: DashboardPaginationProps) {
  const from = totalElements > 0 ? currentPage * pageSize + 1 : 0
  const to = Math.min((currentPage + 1) * pageSize, totalElements)

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 border-t border-border-soft p-4 text-sm text-text-muted",
        className,
      )}
    >
      <span>
        {totalElements > 0
          ? `Showing ${from} to ${to} of ${totalElements.toLocaleString()} results`
          : "Showing 0 results"}
      </span>

      {totalPages > 1 && (
        <Pagination className="w-auto mx-0">
          <PaginationContent className="gap-0.5 rounded-lg border border-border-soft p-1">
            <PaginationItem>
              <PaginationPrevious
                onClick={(e) => {
                  e.preventDefault()
                  onPageChange(Math.max(0, currentPage - 1))
                }}
                aria-disabled={currentPage === 0}
                className={currentPage === 0 ? "pointer-events-none opacity-40" : "cursor-pointer"}
              />
            </PaginationItem>

            {getPageNumbers(currentPage, totalPages).map((page, i) =>
              page === "..." ? (
                <PaginationItem key={`ellipsis-${i}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={page}>
                  <Button
                    type="button"
                    size="icon"
                    variant={currentPage === page ? "outline" : "ghost"}
                    onClick={() => onPageChange(page)}
                    className={cn(
                      "size-9 rounded-md text-sm",
                      currentPage === page && "border-border-strong bg-surface-muted font-semibold text-text-primary",
                    )}
                  >
                    {page + 1}
                  </Button>
                </PaginationItem>
              ),
            )}

            <PaginationItem>
              <PaginationNext
                onClick={(e) => {
                  e.preventDefault()
                  onPageChange(Math.min(totalPages - 1, currentPage + 1))
                }}
                aria-disabled={currentPage >= totalPages - 1}
                className={currentPage >= totalPages - 1 ? "pointer-events-none opacity-40" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  )
}
