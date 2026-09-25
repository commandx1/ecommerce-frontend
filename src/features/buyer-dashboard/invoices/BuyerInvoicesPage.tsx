"use client"

import { AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, Clock3, Download, FileText, Plus } from "lucide-react"
import SectionHeading from "@/components/layout/SectionHeading"
import { Button } from "@/components/ui/button"
import SurfaceCard from "@/components/ui/SurfaceCard"
import formatCurrency from "@/lib/helpers/formatCurrency"
import { cn } from "@/lib/utils"
import InvoiceFiltersBar from "./components/InvoiceFiltersBar"
import InvoiceList from "./components/InvoiceList"
import { StatChip, StatsCard } from "./components/InvoiceStats"
import SelectField from "./components/SelectField"
import { useInvoiceFilters } from "./hooks/useInvoiceFilters"
import type { SortOption } from "./lib/invoice-filters"
import { PAGE_SIZE, sortOptions } from "./lib/invoice-filters"

export default function BuyerInvoicesPage() {
  const {
    dateRange,
    status,
    supplier,
    searchText,
    sortBy,
    currentPage,
    setDateRange,
    setStatus,
    setSupplier,
    setSearchText,
    setSortBy,
    setCurrentPage,
    applyFilters,
    supplierOptions,
    filteredInvoices,
    pagedInvoices,
    pageCount,
    stats,
    selectedInvoiceIds,
    selectedCount,
    allVisibleSelected,
    toggleSelectAllVisible,
    toggleSelectInvoice,
    activeFilters,
    clearAllFilters,
  } = useInvoiceFilters()

  return (
    <SurfaceCard variant="glass" className="overflow-hidden">
      <section className="border-b border-border-soft bg-transparent px-6 py-8">
        <SectionHeading
          titleAs="h1"
          variant="technical"
          title="Invoice Management"
          description="View, download, and manage your invoices and payment status."
        />

        <div className="mt-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <StatChip
              label="Total Outstanding"
              value={formatCurrency(stats.totalOutstanding)}
              valueClassName="text-danger-strong"
            />
            <StatChip
              label="Paid This Month"
              value={formatCurrency(stats.paidThisMonth)}
              valueClassName="text-success"
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="outline">
              <Download className="h-4 w-4" />
              Export All
            </Button>
            <Button type="button">
              <Plus className="h-4 w-4" />
              Request Invoice
            </Button>
          </div>
        </div>
      </section>

      <InvoiceFiltersBar
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        status={status}
        onStatusChange={setStatus}
        supplier={supplier}
        onSupplierChange={setSupplier}
        supplierOptions={supplierOptions}
        searchText={searchText}
        onSearchTextChange={setSearchText}
        onApplyFilters={applyFilters}
        activeFilters={activeFilters}
        onClearAllFilters={clearAllFilters}
      />

      <section className="border-b border-border-soft bg-transparent px-6 py-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatsCard
            icon={<CheckCircle2 className="h-5 w-5 text-success" />}
            iconSurface="bg-success/15"
            value={String(stats.paidCount)}
            label="Paid Invoices"
            caption="+12% vs last month"
            captionClassName="text-success"
          />
          <StatsCard
            icon={<Clock3 className="h-5 w-5 text-warning" />}
            iconSurface="bg-warning/15"
            value={String(stats.pendingCount)}
            label="Pending Invoices"
            caption="2 due this week"
            captionClassName="text-warning-strong"
          />
          <StatsCard
            icon={<AlertTriangle className="h-5 w-5 text-danger" />}
            iconSurface="bg-danger/15"
            value={String(stats.overdueCount)}
            label="Overdue Invoices"
            caption="Action required"
            captionClassName="text-danger-strong"
          />
          <StatsCard
            icon={<FileText className="h-5 w-5 text-brand" />}
            iconSurface="bg-brand/15"
            value={formatCurrency(stats.avgInvoiceAmount)}
            label="Average Invoice Amount"
            caption="+8% vs last month"
            captionClassName="text-brand"
          />
        </div>
      </section>

      <section className="border-b border-border-soft bg-transparent px-6 py-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <label className="inline-flex items-center gap-3 text-sm text-text-secondary">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-border-soft text-brand focus:ring-0"
              checked={allVisibleSelected}
              onChange={toggleSelectAllVisible}
            />
            Select All ({filteredInvoices.length} invoices)
          </label>
          <div className="flex items-center gap-3">
            <span className="text-sm text-text-secondary">Sort by:</span>
            <SelectField
              label="Sort by"
              value={sortBy}
              onChange={(value) => setSortBy(value as SortOption)}
              options={sortOptions}
              compact
            />
          </div>
        </div>
      </section>

      <section className="bg-surface px-6 py-6">
        <InvoiceList
          invoices={pagedInvoices}
          selectedInvoiceIds={selectedInvoiceIds}
          onToggleSelect={toggleSelectInvoice}
        />
      </section>

      <section className="border-t border-border-soft bg-transparent px-6 py-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <p className="text-sm text-text-secondary">
            Showing {filteredInvoices.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}-
            {Math.min(currentPage * PAGE_SIZE, filteredInvoices.length)} of {filteredInvoices.length} invoices
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Previous page"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={currentPage === 1}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border-soft text-text-secondary transition-colors hover:text-brand disabled:opacity-45"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: pageCount }, (_, index) => index + 1).map((page) => (
              <button
                key={page}
                type="button"
                onClick={() => setCurrentPage(page)}
                className={cn(
                  "h-10 min-w-10 rounded-lg border px-3 text-sm font-semibold",
                  page === currentPage
                    ? "border-brand bg-brand text-white"
                    : "border-border-soft bg-surface text-text-secondary hover:text-brand",
                )}
              >
                {page}
              </button>
            ))}
            <button
              type="button"
              aria-label="Next page"
              onClick={() => setCurrentPage((page) => Math.min(pageCount, page + 1))}
              disabled={currentPage === pageCount}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border-soft text-text-secondary transition-colors hover:text-brand disabled:opacity-45"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      {selectedCount > 0 ? (
        <section className="border-t border-border-soft bg-surface-muted/55 px-6 py-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <p className="text-sm text-text-secondary">
              <span className="font-semibold text-text-primary">{selectedCount}</span> invoice
              {selectedCount > 1 ? "s" : ""} selected
            </p>
            <div className="flex flex-wrap gap-3">
              <Button type="button" variant="outline" size="sm">
                <Download className="h-4 w-4" />
                Download Selected
              </Button>
              <Button type="button" variant="outline" size="sm">
                Mark as Paid
              </Button>
              <Button type="button" size="sm">
                Send Reminder
              </Button>
            </div>
          </div>
        </section>
      ) : null}
    </SurfaceCard>
  )
}
