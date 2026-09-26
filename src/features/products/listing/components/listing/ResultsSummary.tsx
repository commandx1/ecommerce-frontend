"use client"

import { useProductFiltersNavigation } from "../../hooks/useProductFiltersNavigation"

interface ResultsSummaryProps {
  totalElements: number
  search: string | null
}

const ResultsSummary = ({ totalElements, search }: ResultsSummaryProps) => {
  const { navigate } = useProductFiltersNavigation()

  return (
    <div className="mb-6 rounded-2xl border border-border-soft bg-surface-elevated p-4 shadow-soft sm:mb-8 sm:p-6">
      <div className="flex flex-col items-center text-center lg:flex-row lg:items-center lg:justify-between lg:text-left">
        <div>
          <h2 className="mb-1.5 text-lg font-bold text-text-primary sm:mb-2 sm:text-2xl">
            {search ? `Results for “${search}”` : `${totalElements} Products Found`}
          </h2>
          <p className="text-sm text-text-secondary sm:text-base">
            {search
              ? `${totalElements} product${totalElements === 1 ? "" : "s"} found`
              : "Showing all dental products from our marketplace"}
          </p>
        </div>
        {search ? (
          <button
            type="button"
            onClick={() => navigate({ search: null })}
            className="mt-3 text-xs font-medium text-text-muted transition-colors hover:text-brand lg:mt-0"
          >
            Clear search
          </button>
        ) : null}
      </div>
    </div>
  )
}

export default ResultsSummary
