import { Filter, Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { DateRangeOption, StatusOption } from "../lib/invoice-filters"
import { dateRangeOptions, statusOptions } from "../lib/invoice-filters"
import SelectField from "./SelectField"

function Label({ children }: { children: React.ReactNode }) {
  return <span className="mb-2 block text-sm font-medium text-text-secondary">{children}</span>
}

export interface ActiveFilterChip {
  key: string
  label: string
  onClear: () => void
}

export default function InvoiceFiltersBar({
  dateRange,
  onDateRangeChange,
  status,
  onStatusChange,
  supplier,
  onSupplierChange,
  supplierOptions,
  searchText,
  onSearchTextChange,
  onApplyFilters,
  activeFilters,
  onClearAllFilters,
}: {
  dateRange: DateRangeOption
  onDateRangeChange: (value: DateRangeOption) => void
  status: StatusOption
  onStatusChange: (value: StatusOption) => void
  supplier: string
  onSupplierChange: (value: string) => void
  supplierOptions: string[]
  searchText: string
  onSearchTextChange: (value: string) => void
  onApplyFilters: () => void
  activeFilters: ActiveFilterChip[]
  onClearAllFilters: () => void
}) {
  return (
    <>
      <section className="border-b border-border-soft bg-transparent px-6 py-6">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <div className="lg:col-span-3">
            <Label>Select Date Range</Label>
            <SelectField
              label="Select Date Range"
              value={dateRange}
              onChange={(value) => onDateRangeChange(value as DateRangeOption)}
              options={dateRangeOptions}
            />
          </div>
          <div className="lg:col-span-2">
            <Label>Status</Label>
            <SelectField
              label="Status"
              value={status}
              onChange={(value) => onStatusChange(value as StatusOption)}
              options={statusOptions}
            />
          </div>
          <div className="lg:col-span-2">
            <Label>Vendor</Label>
            <SelectField label="Vendor" value={supplier} onChange={onSupplierChange} options={supplierOptions} />
          </div>
          <div className="lg:col-span-3">
            <Label>Search</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <input
                value={searchText}
                onChange={(event) => onSearchTextChange(event.target.value)}
                placeholder="Search by invoice number, amount..."
                className="h-11 w-full rounded-lg border border-border-soft bg-surface px-9 text-sm text-text-primary outline-none ring-0 focus:border-brand"
              />
            </div>
          </div>
          <div className="lg:col-span-2 flex items-end">
            <Button type="button" className="w-full" onClick={onApplyFilters}>
              <Filter className="h-4 w-4" />
              Apply Filters
            </Button>
          </div>
        </div>
      </section>

      <section className="border-b border-border-soft bg-surface-muted/55 px-6 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-text-secondary">Active Filters:</span>
          {activeFilters.length > 0 ? (
            activeFilters.map((activeFilter) => (
              <button
                key={activeFilter.key}
                type="button"
                onClick={activeFilter.onClear}
                className="inline-flex items-center gap-2 rounded-full border border-border-soft bg-surface px-3 py-1 text-sm text-text-secondary transition-colors hover:text-brand"
              >
                {activeFilter.label}
                <X className="h-3.5 w-3.5" />
              </button>
            ))
          ) : (
            <span className="text-sm text-text-muted">No active filters</span>
          )}
          {activeFilters.length > 0 ? (
            <button
              type="button"
              onClick={onClearAllFilters}
              className="text-sm font-medium text-brand hover:underline"
            >
              Clear All
            </button>
          ) : null}
        </div>
      </section>
    </>
  )
}
