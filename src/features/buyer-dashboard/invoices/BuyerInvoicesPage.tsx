"use client"

import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Download,
  Eye,
  FileText,
  Filter,
  MoreVertical,
  Plus,
  Search,
  X,
} from "lucide-react"
import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { type BuyerInvoice, buyerInvoices, type InvoiceStatus } from "./invoicesData"

const PAGE_SIZE = 6
const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" })

const dateRangeOptions = ["Last 30 days", "Last 60 days", "Last 90 days", "This Year"] as const
const statusOptions = ["All Statuses", "Paid", "Pending", "Overdue", "Disputed"] as const
const sortOptions = [
  "Date (Newest)",
  "Date (Oldest)",
  "Amount (High to Low)",
  "Amount (Low to High)",
  "Status",
] as const

type DateRangeOption = (typeof dateRangeOptions)[number]
type StatusOption = (typeof statusOptions)[number]
type SortOption = (typeof sortOptions)[number]

const statusPillMap: Record<InvoiceStatus, string> = {
  Paid: "bg-success/15 text-success border border-success/30",
  Pending: "bg-warning/15 text-warning border border-warning/30",
  Overdue: "bg-danger/15 text-danger border border-danger/30",
  Disputed: "bg-brand/15 text-brand border border-brand/30",
}

const statusNoteMap: Record<InvoiceStatus, string> = {
  Paid: "text-success",
  Pending: "text-warning",
  Overdue: "text-danger",
  Disputed: "text-brand",
}

const rangeDaysMap: Record<DateRangeOption, number> = {
  "Last 30 days": 30,
  "Last 60 days": 60,
  "Last 90 days": 90,
  "This Year": 365,
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

function getSupplierOptions(invoices: ReadonlyArray<BuyerInvoice>): string[] {
  return [
    "All Vendors",
    ...Array.from(new Set(invoices.map((invoice) => invoice.supplier))).sort((a, b) => a.localeCompare(b)),
  ]
}

export default function BuyerInvoicesPage() {
  const [dateRange, setDateRange] = useState<DateRangeOption>("Last 30 days")
  const [status, setStatus] = useState<StatusOption>("All Statuses")
  const [supplier, setSupplier] = useState("All Vendors")
  const [searchText, setSearchText] = useState("")
  const [sortBy, setSortBy] = useState<SortOption>("Date (Newest)")
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<Set<string>>(new Set())
  const [currentPage, setCurrentPage] = useState(1)

  const supplierOptions = useMemo(() => getSupplierOptions(buyerInvoices), [])

  const filteredInvoices = useMemo(() => {
    const today = new Date("2026-05-01")
    const dayLimit = rangeDaysMap[dateRange]
    const normalizedSearch = searchText.trim().toLowerCase()

    const filtered = buyerInvoices.filter((invoice) => {
      const issueDate = new Date(invoice.issueDate)
      const ageInDays = Math.floor((today.getTime() - issueDate.getTime()) / (1000 * 60 * 60 * 24))
      const dateMatch = ageInDays <= dayLimit
      const statusMatch = status === "All Statuses" || invoice.status === status
      const supplierMatch = supplier === "All Vendors" || invoice.supplier === supplier
      const searchMatch =
        normalizedSearch.length === 0 ||
        invoice.id.toLowerCase().includes(normalizedSearch) ||
        invoice.supplier.toLowerCase().includes(normalizedSearch) ||
        invoice.itemsSummary.toLowerCase().includes(normalizedSearch) ||
        invoice.amount.toString().includes(normalizedSearch)

      return dateMatch && statusMatch && supplierMatch && searchMatch
    })

    return [...filtered].sort((left, right) => {
      if (sortBy === "Date (Oldest)") return new Date(left.issueDate).getTime() - new Date(right.issueDate).getTime()
      if (sortBy === "Amount (High to Low)") return right.amount - left.amount
      if (sortBy === "Amount (Low to High)") return left.amount - right.amount
      if (sortBy === "Status") return left.status.localeCompare(right.status)
      return new Date(right.issueDate).getTime() - new Date(left.issueDate).getTime()
    })
  }, [dateRange, searchText, sortBy, status, supplier])

  const pageCount = Math.max(1, Math.ceil(filteredInvoices.length / PAGE_SIZE))
  const pagedInvoices = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return filteredInvoices.slice(start, start + PAGE_SIZE)
  }, [currentPage, filteredInvoices])

  const totalOutstanding = useMemo(
    () =>
      buyerInvoices
        .filter((invoice) => invoice.status === "Pending" || invoice.status === "Overdue")
        .reduce((total, invoice) => total + invoice.amount, 0),
    [],
  )
  const paidThisMonth = useMemo(
    () =>
      buyerInvoices
        .filter((invoice) => invoice.status === "Paid" && invoice.issueDate.startsWith("2026-04"))
        .reduce((total, invoice) => total + invoice.amount, 0),
    [],
  )
  const paidCount = buyerInvoices.filter((invoice) => invoice.status === "Paid").length
  const pendingCount = buyerInvoices.filter((invoice) => invoice.status === "Pending").length
  const overdueCount = buyerInvoices.filter((invoice) => invoice.status === "Overdue").length
  const avgInvoiceAmount = buyerInvoices.reduce((total, invoice) => total + invoice.amount, 0) / buyerInvoices.length

  const selectedCount = selectedInvoiceIds.size

  const allVisibleSelected =
    pagedInvoices.length > 0 && pagedInvoices.every((invoice) => selectedInvoiceIds.has(invoice.id))

  const activeFilters = [
    dateRange !== "Last 30 days"
      ? { key: "date", label: `Date: ${dateRange}`, onClear: () => setDateRange("Last 30 days") }
      : null,
    status !== "All Statuses"
      ? { key: "status", label: `Status: ${status}`, onClear: () => setStatus("All Statuses") }
      : null,
    supplier !== "All Vendors"
      ? { key: "supplier", label: `Vendor: ${supplier}`, onClear: () => setSupplier("All Vendors") }
      : null,
    searchText.trim().length > 0
      ? { key: "search", label: `Search: ${searchText}`, onClear: () => setSearchText("") }
      : null,
  ].filter((item): item is { key: string; label: string; onClear: () => void } => Boolean(item))

  const toggleSelectAllVisible = () => {
    if (allVisibleSelected) {
      const next = new Set(selectedInvoiceIds)
      pagedInvoices.forEach((invoice) => next.delete(invoice.id))
      setSelectedInvoiceIds(next)
      return
    }

    const next = new Set(selectedInvoiceIds)
    pagedInvoices.forEach((invoice) => next.add(invoice.id))
    setSelectedInvoiceIds(next)
  }

  const toggleSelectInvoice = (invoiceId: string) => {
    const next = new Set(selectedInvoiceIds)
    if (next.has(invoiceId)) next.delete(invoiceId)
    else next.add(invoiceId)
    setSelectedInvoiceIds(next)
  }

  const clearAllFilters = () => {
    setDateRange("Last 30 days")
    setStatus("All Statuses")
    setSupplier("All Vendors")
    setSearchText("")
    setSortBy("Date (Newest)")
  }

  return (
    <div className="overflow-hidden rounded-[1.25rem] border border-border-soft bg-surface shadow-soft">
      <section className="border-b border-border-soft bg-surface-elevated px-6 py-8">
        <div className="flex flex-wrap items-center gap-4">
          <div className="rounded-xl bg-brand p-3 text-white">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-text-primary">Invoice Management</h1>
            <p className="mt-1 text-text-secondary">View, download, and manage your invoices and payment status.</p>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <StatChip
              label="Total Outstanding"
              value={currency.format(totalOutstanding)}
              valueClassName="text-danger"
            />
            <StatChip label="Paid This Month" value={currency.format(paidThisMonth)} valueClassName="text-success" />
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

      <section className="border-b border-border-soft bg-surface-elevated px-6 py-6">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <div className="lg:col-span-3">
            <Label>Select Date Range</Label>
            <SelectField
              value={dateRange}
              onChange={(value) => setDateRange(value as DateRangeOption)}
              options={dateRangeOptions}
            />
          </div>
          <div className="lg:col-span-2">
            <Label>Status</Label>
            <SelectField
              value={status}
              onChange={(value) => setStatus(value as StatusOption)}
              options={statusOptions}
            />
          </div>
          <div className="lg:col-span-2">
            <Label>Vendor</Label>
            <SelectField value={supplier} onChange={setSupplier} options={supplierOptions} />
          </div>
          <div className="lg:col-span-3">
            <Label>Search</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <input
                value={searchText}
                onChange={(event) => {
                  setSearchText(event.target.value)
                  setCurrentPage(1)
                }}
                placeholder="Search by invoice number, amount..."
                className="h-11 w-full rounded-lg border border-border-soft bg-surface px-9 text-sm text-text-primary outline-none ring-0 focus:border-brand"
              />
            </div>
          </div>
          <div className="lg:col-span-2 flex items-end">
            <Button type="button" className="w-full" onClick={() => setCurrentPage(1)}>
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
            <button type="button" onClick={clearAllFilters} className="text-sm font-medium text-brand hover:underline">
              Clear All
            </button>
          ) : null}
        </div>
      </section>

      <section className="border-b border-border-soft bg-surface-elevated px-6 py-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatsCard
            icon={<CheckCircle2 className="h-5 w-5 text-success" />}
            iconSurface="bg-success/15"
            value={String(paidCount)}
            label="Paid Invoices"
            caption="+12% vs last month"
            captionClassName="text-success"
          />
          <StatsCard
            icon={<Clock3 className="h-5 w-5 text-warning" />}
            iconSurface="bg-warning/15"
            value={String(pendingCount)}
            label="Pending Invoices"
            caption="2 due this week"
            captionClassName="text-warning"
          />
          <StatsCard
            icon={<AlertTriangle className="h-5 w-5 text-danger" />}
            iconSurface="bg-danger/15"
            value={String(overdueCount)}
            label="Overdue Invoices"
            caption="Action required"
            captionClassName="text-danger"
          />
          <StatsCard
            icon={<FileText className="h-5 w-5 text-brand" />}
            iconSurface="bg-brand/15"
            value={currency.format(avgInvoiceAmount)}
            label="Average Invoice Amount"
            caption="+8% vs last month"
            captionClassName="text-brand"
          />
        </div>
      </section>

      <section className="border-b border-border-soft bg-surface-elevated px-6 py-4">
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
              value={sortBy}
              onChange={(value) => setSortBy(value as SortOption)}
              options={sortOptions}
              compact
            />
          </div>
        </div>
      </section>

      <section className="bg-surface px-6 py-6">
        <div className="space-y-4">
          {pagedInvoices.map((invoice) => (
            <InvoiceCard
              key={invoice.id}
              invoice={invoice}
              selected={selectedInvoiceIds.has(invoice.id)}
              onToggleSelect={() => toggleSelectInvoice(invoice.id)}
            />
          ))}
          {pagedInvoices.length === 0 ? (
            <div className="rounded-xl border border-border-soft bg-surface-elevated p-6 text-sm text-text-secondary">
              No invoices match the selected filters.
            </div>
          ) : null}
        </div>
      </section>

      <section className="border-t border-border-soft bg-surface-elevated px-6 py-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <p className="text-sm text-text-secondary">
            Showing {filteredInvoices.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}-
            {Math.min(currentPage * PAGE_SIZE, filteredInvoices.length)} of {filteredInvoices.length} invoices
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
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
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="mb-2 block text-sm font-medium text-text-secondary">{children}</label>
}

function SelectField({
  value,
  onChange,
  options,
  compact = false,
}: {
  value: string
  onChange: (value: string) => void
  options: ReadonlyArray<string>
  compact?: boolean
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          "w-full appearance-none rounded-lg border border-border-soft bg-surface px-4 pr-9 text-sm text-text-primary outline-none transition-colors focus:border-brand",
          compact ? "h-10" : "h-11",
        )}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-text-muted" />
    </div>
  )
}

function StatChip({ label, value, valueClassName }: { label: string; value: string; valueClassName?: string }) {
  return (
    <div className="rounded-lg border border-border-soft bg-surface px-4 py-2">
      <span className="text-sm text-text-secondary">{label}:</span>
      <span className={cn("ml-2 text-lg font-bold text-text-primary", valueClassName)}>{value}</span>
    </div>
  )
}

function StatsCard({
  icon,
  iconSurface,
  value,
  label,
  caption,
  captionClassName,
}: {
  icon: React.ReactNode
  iconSurface: string
  value: string
  label: string
  caption: string
  captionClassName: string
}) {
  return (
    <article className="rounded-xl border border-border-soft bg-surface p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className={cn("flex h-11 w-11 items-center justify-center rounded-lg", iconSurface)}>{icon}</div>
      </div>
      <p className="text-2xl font-bold text-text-primary">{value}</p>
      <p className="mt-1 text-sm text-text-secondary">{label}</p>
      <p className={cn("mt-2 text-xs font-medium", captionClassName)}>{caption}</p>
    </article>
  )
}

function InvoiceCard({
  invoice,
  selected,
  onToggleSelect,
}: {
  invoice: BuyerInvoice
  selected: boolean
  onToggleSelect: () => void
}) {
  return (
    <article className="rounded-xl border border-border-soft bg-surface-elevated p-5 shadow-soft transition-shadow hover:shadow-panel">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex gap-4">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 rounded border-border-soft text-brand focus:ring-0"
            checked={selected}
            onChange={onToggleSelect}
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-lg font-semibold text-text-primary">Invoice #{invoice.id}</span>
              <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", statusPillMap[invoice.status])}>
                {invoice.status}
              </span>
            </div>
            <p className="mt-1 text-sm text-text-secondary">
              {invoice.supplier} • {formatDate(invoice.issueDate)}
            </p>
            <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-3">
              <InvoiceMeta label="Items" value={invoice.itemsSummary} />
              <InvoiceMeta label="Payment Method" value={invoice.paymentMethod} />
              <InvoiceMeta label="Due Date" value={formatDate(invoice.dueDate)} />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 xl:justify-end">
          <div className="text-left xl:text-right">
            <p className="text-2xl font-bold text-text-primary">{currency.format(invoice.amount)}</p>
            <p className={cn("text-sm", statusNoteMap[invoice.status])}>{invoice.statusNote}</p>
          </div>
          <div className="flex items-center gap-2">
            <ActionIconButton icon={<Download className="h-4 w-4" />} label="Download PDF" />
            <ActionIconButton icon={<Eye className="h-4 w-4" />} label="View Details" />
            <ActionIconButton icon={<MoreVertical className="h-4 w-4" />} label="More Actions" />
            {invoice.status === "Pending" || invoice.status === "Overdue" ? (
              <Button type="button" size="sm">
                Pay Now
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  )
}

function InvoiceMeta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted">{label}</p>
      <p className="mt-1 text-sm text-text-secondary">{value}</p>
    </div>
  )
}

function ActionIconButton({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border-soft text-text-muted transition-colors hover:text-brand"
    >
      {icon}
    </button>
  )
}
