"use client"

import { Percent, Search, X } from "lucide-react"
import AnimatedTabs from "@/components/ui/animated-tabs"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { PeriodTab, ReviewApprovedFilter, ViewMode } from "../types"

const PERIOD_TABS: ReadonlyArray<{ label: string; value: PeriodTab }> = [
  { label: "3 months", value: "3 months" },
  { label: "6 months", value: "6 months" },
  { label: "12 months", value: "12 months" },
]

const REVIEW_APPROVED_FILTER_OPTIONS: ReadonlyArray<{ label: string; value: ReviewApprovedFilter }> = [
  { label: "Pending Review", value: "NULL" },
  { label: "Rejected", value: "FALSE" },
  { label: "All", value: "ALL" },
]

interface ProductsToolbarProps {
  viewMode: ViewMode
  searchQuery: string
  onSearchChange: (query: string) => void
  selectedPeriodTab: PeriodTab
  onPeriodTabChange: (period: PeriodTab) => void
  controlsDisabled: boolean
  selectedBrand: string
  brandFilterAll: string
  brandOptions: string[]
  onBrandChange: (brand: string) => void
  reviewApprovedFilter: ReviewApprovedFilter
  onReviewApprovedFilterChange: (filter: ReviewApprovedFilter) => void
  totalElements: number
  currentPage: number
  pageSize: number
  selectedCount: number
  onClearSelection: () => void
  onOpenBulkDiscount: () => void
}

/** The filter/search row above the table, the "Showing X-Y of Z" counter, and the bulk-action
 * bar that appears once rows are selected. */
export default function ProductsToolbar({
  viewMode,
  searchQuery,
  onSearchChange,
  selectedPeriodTab,
  onPeriodTabChange,
  controlsDisabled,
  selectedBrand,
  brandFilterAll,
  brandOptions,
  onBrandChange,
  reviewApprovedFilter,
  onReviewApprovedFilterChange,
  totalElements,
  currentPage,
  pageSize,
  selectedCount,
  onClearSelection,
  onOpenBulkDiscount,
}: ProductsToolbarProps) {
  return (
    <div className="border-b border-border-soft p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {viewMode === "products" ? (
          <div className="max-w-lg flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Search products by name"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full rounded-lg border border-border-strong py-2 pl-10 pr-4 text-text-primary placeholder:text-text-muted focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand/40"
              />
              <Search className="absolute left-3 top-3 text-text-muted w-4 h-4" />
            </div>
          </div>
        ) : (
          <div />
        )}

        {viewMode === "products" ? (
          <div className="flex flex-col gap-3 self-start sm:flex-row sm:items-center lg:self-auto">
            <AnimatedTabs<PeriodTab>
              value={selectedPeriodTab}
              options={PERIOD_TABS}
              onValueChange={onPeriodTabChange}
              disabled={controlsDisabled}
              className="self-start sm:self-auto"
            />
            <Select value={selectedBrand} onValueChange={onBrandChange} disabled={brandOptions.length === 0}>
              <SelectTrigger
                aria-label="Brand"
                className="h-11 w-full rounded-2xl border border-border-soft bg-surface-elevated shadow-soft sm:w-56"
              >
                <SelectValue placeholder="All Brands" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={brandFilterAll}>All Brands</SelectItem>
                {brandOptions.map((brand) => (
                  <SelectItem key={brand} value={brand}>
                    {brand}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <Select
            value={reviewApprovedFilter}
            onValueChange={(value) => onReviewApprovedFilterChange(value as ReviewApprovedFilter)}
          >
            <SelectTrigger
              aria-label="Status"
              className="h-11 w-full rounded-2xl border border-border-soft bg-surface-elevated shadow-soft lg:w-48"
            >
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {REVIEW_APPROVED_FILTER_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {totalElements > 0 && (
        <div className="mt-4 pt-4 border-t border-border-soft text-sm text-text-secondary">
          <div className="text-sm text-text-secondary">
            Showing{" "}
            <span className="font-semibold text-brand">
              {currentPage * pageSize + 1}-{Math.min((currentPage + 1) * pageSize, totalElements)}
            </span>{" "}
            of <span className="font-semibold text-brand">{totalElements}</span> products
          </div>
        </div>
      )}

      {/* Bulk actions — visible only while rows are selected */}
      {viewMode === "products" && selectedCount > 0 && (
        <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-brand/25 bg-brand/8 px-4 py-3 shadow-soft sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-brand px-2 text-xs font-semibold text-primary-foreground">
              {selectedCount}
            </span>
            <span className="text-sm font-medium text-text-primary">
              product{selectedCount > 1 ? "s" : ""} selected
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button type="button" variant="quiet" onClick={onClearSelection} className="rounded-lg px-3">
              <X className="h-4 w-4" />
              Clear
            </Button>
            <Button type="button" onClick={onOpenBulkDiscount} className="rounded-lg px-4">
              <Percent className="h-4 w-4" />
              Bulk Discount
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
