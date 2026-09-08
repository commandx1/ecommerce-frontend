import { ChevronRight } from "lucide-react"
import Link from "next/link"

interface PaginationBarProps {
  currentPage: number
  pageSize: number
  totalElements: number
  totalPages: number
  buildUrl: (overrides: { page?: number; size?: number }) => string
}

const PaginationBar = ({ currentPage, pageSize, totalElements, totalPages, buildUrl }: PaginationBarProps) => {
  return (
    <div className="mt-4 rounded-2xl border border-border-soft bg-surface-elevated p-6 shadow-soft">
      <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
        <span className="text-sm text-text-secondary">
          Showing{" "}
          <span className="font-bold text-brand">
            {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, totalElements)}
          </span>{" "}
          of <span className="font-bold text-brand">{totalElements}</span>
        </span>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">Items per page</span>
          {[10, 20, 50, 100].map((size) => (
            <Link
              key={size}
              href={buildUrl({ page: 1, size })}
              aria-current={pageSize === size ? "true" : undefined}
              className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                pageSize === size
                  ? "border-brand/40 bg-brand/10 font-semibold text-brand"
                  : "border-border-soft bg-surface text-text-secondary hover:border-brand/30 hover:text-brand"
              }`}
            >
              {size}
            </Link>
          ))}
        </div>
      </div>

      <div className="my-4 border-t border-border-soft/70" />

      <div className="flex items-center justify-center gap-2">
        {currentPage === 1 ? (
          <span className="rounded-xl border border-border-soft bg-surface-muted/70 p-2 text-text-muted opacity-40">
            <ChevronRight className="w-5 h-5 rotate-180" />
          </span>
        ) : (
          <Link
            href={buildUrl({ page: currentPage - 1 })}
            className="rounded-xl border border-border-soft bg-surface-muted/70 p-2 text-text-secondary transition-colors hover:bg-surface hover:text-brand"
          >
            <ChevronRight className="w-5 h-5 rotate-180" />
          </Link>
        )}

        {Array.from({ length: totalPages }).map((_, i) => {
          const pageNumber = i + 1
          return (
            <Link
              key={pageNumber}
              href={buildUrl({ page: pageNumber })}
              className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold transition-colors ${
                currentPage === pageNumber
                  ? "bg-accent-strong text-accent-foreground shadow-soft"
                  : "bg-surface-muted/70 text-text-secondary hover:bg-surface hover:text-brand"
              }`}
            >
              {pageNumber}
            </Link>
          )
        })}

        {currentPage >= totalPages ? (
          <span className="rounded-xl border border-border-soft bg-surface-muted/70 p-2 text-text-muted opacity-40">
            <ChevronRight className="w-5 h-5" />
          </span>
        ) : (
          <Link
            href={buildUrl({ page: currentPage + 1 })}
            className="rounded-xl border border-border-soft bg-surface-muted/70 p-2 text-text-secondary transition-colors hover:bg-surface hover:text-brand"
          >
            <ChevronRight className="w-5 h-5" />
          </Link>
        )}
      </div>
    </div>
  )
}

export default PaginationBar
