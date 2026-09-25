"use client"

import { useMemo, useState } from "react"
import type { BuyerInvoice } from "../invoicesData"
import { buyerInvoices } from "../invoicesData"
import {
  computeInvoiceStats,
  type DateRangeOption,
  filterInvoices,
  getPageCount,
  getSupplierOptions,
  type InvoiceStats,
  paginate,
  type SortOption,
  type StatusOption,
  sortInvoices,
} from "../lib/invoice-filters"

// The "today" the date-range filter measures against - hardcoded, not `new Date()`. Locked by
// `BuyerInvoicesPage.test.tsx`; do not change without updating that test deliberately.
const TODAY = new Date("2026-05-01")

interface ActiveFilterChip {
  key: string
  label: string
  onClear: () => void
}

export interface UseInvoiceFiltersResult {
  dateRange: DateRangeOption
  status: StatusOption
  supplier: string
  searchText: string
  sortBy: SortOption
  currentPage: number
  setDateRange: (value: DateRangeOption) => void
  setStatus: (value: StatusOption) => void
  setSupplier: (value: string) => void
  /** Also resets `currentPage` to 1, unlike the other filters, which only reset it on "Apply Filters". */
  setSearchText: (value: string) => void
  setSortBy: (value: SortOption) => void
  setCurrentPage: (updater: number | ((page: number) => number)) => void
  applyFilters: () => void
  supplierOptions: string[]
  filteredInvoices: BuyerInvoice[]
  pagedInvoices: BuyerInvoice[]
  pageCount: number
  stats: InvoiceStats
  selectedInvoiceIds: Set<string>
  selectedCount: number
  allVisibleSelected: boolean
  toggleSelectAllVisible: () => void
  toggleSelectInvoice: (invoiceId: string) => void
  activeFilters: ActiveFilterChip[]
  clearAllFilters: () => void
}

/** Filter/sort/selection/page state plus the derived paged view for `BuyerInvoicesPage`. */
export function useInvoiceFilters(): UseInvoiceFiltersResult {
  const [dateRange, setDateRange] = useState<DateRangeOption>("Last 30 days")
  const [status, setStatus] = useState<StatusOption>("All Statuses")
  const [supplier, setSupplier] = useState("All Vendors")
  const [searchText, setSearchTextState] = useState("")
  const [sortBy, setSortBy] = useState<SortOption>("Date (Newest)")
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<Set<string>>(new Set())
  const [currentPage, setCurrentPage] = useState(1)

  const supplierOptions = useMemo(() => getSupplierOptions(buyerInvoices), [])

  const filteredInvoices = useMemo(() => {
    const filtered = filterInvoices(buyerInvoices, { dateRange, status, supplier, search: searchText }, TODAY)
    return sortInvoices(filtered, sortBy)
  }, [dateRange, searchText, sortBy, status, supplier])

  const pageCount = getPageCount(filteredInvoices.length)
  const pagedInvoices = useMemo(() => paginate(filteredInvoices, currentPage), [currentPage, filteredInvoices])

  const stats = useMemo(() => computeInvoiceStats(buyerInvoices), [])

  const selectedCount = selectedInvoiceIds.size
  const allVisibleSelected =
    pagedInvoices.length > 0 && pagedInvoices.every((invoice) => selectedInvoiceIds.has(invoice.id))

  const activeFilters: ActiveFilterChip[] = [
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
      ? { key: "search", label: `Search: ${searchText}`, onClear: () => setSearchTextState("") }
      : null,
  ].filter((item): item is ActiveFilterChip => Boolean(item))

  const setSearchText = (value: string) => {
    setSearchTextState(value)
    setCurrentPage(1)
  }

  const applyFilters = () => setCurrentPage(1)

  const toggleSelectAllVisible = () => {
    if (allVisibleSelected) {
      const next = new Set(selectedInvoiceIds)
      for (const invoice of pagedInvoices) next.delete(invoice.id)
      setSelectedInvoiceIds(next)
      return
    }

    const next = new Set(selectedInvoiceIds)
    for (const invoice of pagedInvoices) next.add(invoice.id)
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
    setSearchTextState("")
    setSortBy("Date (Newest)")
  }

  return {
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
  }
}
