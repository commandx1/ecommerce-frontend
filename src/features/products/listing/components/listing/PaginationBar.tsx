import { ChevronRight } from "lucide-react"
import Link from "next/link"

interface PaginationBarProps {
  currentPage: number
  pageSize: number
  totalElements: number
  totalPages: number
  buildUrl: (overrides: { page?: number; size?: number; view?: "grid" | "list" }) => string
}

const PaginationBar = ({ currentPage, pageSize, totalElements, totalPages, buildUrl }: PaginationBarProps) => {
  return (
    <div className="mt-4 flex flex-col items-center justify-between gap-4 rounded-2xl border border-border-soft bg-surface-elevated p-6 shadow-soft md:flex-row">
      <span className="text-sm text-text-secondary">
        Showing{" "}
        <span className="font-bold text-brand">
          {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, totalElements)}
        </span>{" "}
        of <span className="font-bold text-brand">{totalElements}</span>
      </span>
      <div className="flex items-center gap-2">
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
