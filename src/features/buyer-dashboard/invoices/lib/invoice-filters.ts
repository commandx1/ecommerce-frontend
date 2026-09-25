import type { BuyerInvoice, InvoiceStatus } from "../invoicesData"

/**
 * Pure filter/sort/paginate/stat logic for `BuyerInvoicesPage` (Phase 4 design doc §7, step B1).
 * Data stays static mock (`invoicesData.ts`) - this is a structure-only refactor, not a Query
 * migration. `filterInvoices`/`computeInvoiceStats` take an explicit `today` (default `new
 * Date()`) instead of computing it internally, so a test can pin it with `vi.setSystemTime`;
 * `BuyerInvoicesPage.tsx` passes the hardcoded `2026-05-01` it always has, so the (deliberately
 * locked, see `BuyerInvoicesPage.test.tsx`) "today" bug is unchanged.
 */

export const PAGE_SIZE = 6

export const dateRangeOptions = ["Last 30 days", "Last 60 days", "Last 90 days", "This Year"] as const
export const statusOptions = ["All Statuses", "Paid", "Pending", "Overdue", "Disputed"] as const
export const sortOptions = [
  "Date (Newest)",
  "Date (Oldest)",
  "Amount (High to Low)",
  "Amount (Low to High)",
  "Status",
] as const

export type DateRangeOption = (typeof dateRangeOptions)[number]
export type StatusOption = (typeof statusOptions)[number]
export type SortOption = (typeof sortOptions)[number]

export const rangeDaysMap: Record<DateRangeOption, number> = {
  "Last 30 days": 30,
  "Last 60 days": 60,
  "Last 90 days": 90,
  "This Year": 365,
}

export interface InvoiceFilterValues {
  dateRange: DateRangeOption
  status: StatusOption
  supplier: string
  search: string
}

export function getSupplierOptions(invoices: ReadonlyArray<BuyerInvoice>): string[] {
  return [
    "All Vendors",
    ...Array.from(new Set(invoices.map((invoice) => invoice.supplier))).sort((a, b) => a.localeCompare(b)),
  ]
}

export function filterInvoices(
  invoices: ReadonlyArray<BuyerInvoice>,
  filters: InvoiceFilterValues,
  today: Date = new Date(),
): BuyerInvoice[] {
  const dayLimit = rangeDaysMap[filters.dateRange]
  const normalizedSearch = filters.search.trim().toLowerCase()

  return invoices.filter((invoice) => {
    const issueDate = new Date(invoice.issueDate)
    const ageInDays = Math.floor((today.getTime() - issueDate.getTime()) / (1000 * 60 * 60 * 24))
    const dateMatch = ageInDays <= dayLimit
    const statusMatch = filters.status === "All Statuses" || invoice.status === filters.status
    const supplierMatch = filters.supplier === "All Vendors" || invoice.supplier === filters.supplier
    const searchMatch =
      normalizedSearch.length === 0 ||
      invoice.id.toLowerCase().includes(normalizedSearch) ||
      invoice.supplier.toLowerCase().includes(normalizedSearch) ||
      invoice.itemsSummary.toLowerCase().includes(normalizedSearch) ||
      invoice.amount.toString().includes(normalizedSearch)

    return dateMatch && statusMatch && supplierMatch && searchMatch
  })
}

export function sortInvoices(invoices: ReadonlyArray<BuyerInvoice>, sortBy: SortOption): BuyerInvoice[] {
  return [...invoices].sort((left, right) => {
    if (sortBy === "Date (Oldest)") return new Date(left.issueDate).getTime() - new Date(right.issueDate).getTime()
    if (sortBy === "Amount (High to Low)") return right.amount - left.amount
    if (sortBy === "Amount (Low to High)") return left.amount - right.amount
    if (sortBy === "Status") return left.status.localeCompare(right.status)
    return new Date(right.issueDate).getTime() - new Date(left.issueDate).getTime()
  })
}

export function getPageCount(totalItems: number, pageSize: number = PAGE_SIZE): number {
  return Math.max(1, Math.ceil(totalItems / pageSize))
}

export function paginate<T>(items: ReadonlyArray<T>, page: number, pageSize: number = PAGE_SIZE): T[] {
  const start = (page - 1) * pageSize
  return items.slice(start, start + pageSize)
}

export interface InvoiceStats {
  totalOutstanding: number
  paidThisMonth: number
  paidCount: number
  pendingCount: number
  overdueCount: number
  avgInvoiceAmount: number
}

// Hardcoded, same as the pre-extraction inline check - NOT derived from `today`. The mock data
// is fixed to March/April 2026, and "today" (2026-05-01) is a different, independently-locked
// constant (see the file header); deriving one from the other would silently zero out this
// figure (no invoice is dated in May), a behaviour change this refactor must not make.
const PAID_THIS_MONTH_PREFIX = "2026-04"

export function computeInvoiceStats(invoices: ReadonlyArray<BuyerInvoice>): InvoiceStats {
  const totalOutstanding = invoices
    .filter((invoice) => invoice.status === "Pending" || invoice.status === "Overdue")
    .reduce((total, invoice) => total + invoice.amount, 0)

  const paidThisMonth = invoices
    .filter((invoice) => invoice.status === "Paid" && invoice.issueDate.startsWith(PAID_THIS_MONTH_PREFIX))
    .reduce((total, invoice) => total + invoice.amount, 0)

  const countByStatus = (status: InvoiceStatus) => invoices.filter((invoice) => invoice.status === status).length

  const avgInvoiceAmount =
    invoices.length === 0 ? 0 : invoices.reduce((total, invoice) => total + invoice.amount, 0) / invoices.length

  return {
    totalOutstanding,
    paidThisMonth,
    paidCount: countByStatus("Paid"),
    pendingCount: countByStatus("Pending"),
    overdueCount: countByStatus("Overdue"),
    avgInvoiceAmount,
  }
}
