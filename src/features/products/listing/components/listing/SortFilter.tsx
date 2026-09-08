"use client"

import { useId } from "react"
import { Radio } from "@/components/ui/radio"
import { cn } from "@/lib/utils"
import { useProductFiltersNavigation } from "../../hooks/useProductFiltersNavigation"
import { type SortValue, VALID_SORT_VALUES } from "../../server/parse-listing-search-params"

const SORT_LABELS: Record<SortValue, string> = {
  "best-match": "Best Match",
  "price-asc": "Price: Low to High",
  "price-desc": "Price: High to Low",
  rating: "Best Rating",
  newest: "Newest First",
  "name-asc": "Name A–Z",
}

const ALL_SORT_VALUES: SortValue[] = ["best-match", ...VALID_SORT_VALUES]

const SortFilter = () => {
  const uid = useId()
  const { navigate, currentSort, isPending } = useProductFiltersNavigation()

  return (
    <div className="border-b border-border-soft p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-text-primary">Sort by</h2>
        {currentSort !== "best-match" && (
          <button
            type="button"
            onClick={() => navigate({ sort: "best-match" })}
            className="text-xs font-medium text-text-muted hover:text-brand transition-colors"
          >
            Clear
          </button>
        )}
      </div>
      <div className="space-y-1" role="radiogroup" aria-label="Sort products">
        {ALL_SORT_VALUES.map((value) => {
          const isActive = currentSort === value
          return (
            // biome-ignore lint/a11y/noLabelWithoutControl: the Radio input is nested inside this label, biome can't see through the custom component
            <label
              key={value}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-brand/10 font-semibold text-brand"
                  : "text-text-secondary hover:bg-surface-muted hover:text-text-primary",
              )}
            >
              <Radio
                name={`${uid}-sort`}
                value={value}
                checked={isActive}
                disabled={isPending}
                onChange={() => navigate({ sort: value })}
              />
              {SORT_LABELS[value]}
            </label>
          )
        })}
      </div>
    </div>
  )
}

export default SortFilter
