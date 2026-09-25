"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useMemo } from "react"
import { VENDOR_CUSTOMERS, type VendorCustomer } from "../lib/customers-data"

const PAGE_SIZE = 10

export type CustomerSortKey = "totalSpend" | "lastOrderDaysAgo" | "averageOrderValue" | "orders" | "returnRate"
export type CustomerSortDir = "asc" | "desc"

export interface CustomerListFiltersViewModel {
  query: string
  segment: string
  status: string
  sortBy: CustomerSortKey
  sortDir: CustomerSortDir
  pageRows: VendorCustomer[]
  sortedCount: number
  totalPages: number
  safePage: number
  pageStart: number
  setQuery: (value: string) => void
  setSegment: (value: string) => void
  setStatus: (value: string) => void
  setSortBy: (value: string) => void
  setSortDir: (value: string) => void
  goToPage: (page: number) => void
}

/** Filter/sort/page state lives in the URL (`router.replace`), so the list is shareable and survives a refresh. */
export function useCustomerListFilters(): CustomerListFiltersViewModel {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()

  const query = searchParams.get("q") ?? ""
  const segment = searchParams.get("segment") ?? "all"
  const status = searchParams.get("status") ?? "all"
  const sortBy = (searchParams.get("sort") as CustomerSortKey | null) ?? "totalSpend"
  const sortDir = (searchParams.get("dir") as CustomerSortDir | null) ?? "desc"
  const page = Number(searchParams.get("page") ?? "1")

  const filteredCustomers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return VENDOR_CUSTOMERS.filter((customer) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        customer.name.toLowerCase().includes(normalizedQuery) ||
        customer.clinicName.toLowerCase().includes(normalizedQuery) ||
        customer.email.toLowerCase().includes(normalizedQuery)
      const matchesSegment = segment === "all" || customer.segment === segment
      const matchesStatus = status === "all" || customer.health === status
      return matchesQuery && matchesSegment && matchesStatus
    })
  }, [query, segment, status])

  const sortedCustomers = useMemo(() => {
    return [...filteredCustomers].sort((a: VendorCustomer, b: VendorCustomer) => {
      const left = a[sortBy]
      const right = b[sortBy]
      if (left === right) return 0
      if (sortDir === "asc") return left > right ? 1 : -1
      return left > right ? -1 : 1
    })
  }, [filteredCustomers, sortBy, sortDir])

  const totalPages = Math.max(1, Math.ceil(sortedCustomers.length / PAGE_SIZE))
  const safePage = Number.isNaN(page) ? 1 : Math.min(Math.max(page, 1), totalPages)
  const pageStart = (safePage - 1) * PAGE_SIZE
  const pageRows = sortedCustomers.slice(pageStart, pageStart + PAGE_SIZE)

  const updateParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === "" || value === "all") {
        params.delete(key)
      } else {
        params.set(key, value)
      }
    })

    const queryString = params.toString()
    router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false })
  }

  return {
    query,
    segment,
    status,
    sortBy,
    sortDir,
    pageRows,
    sortedCount: sortedCustomers.length,
    totalPages,
    safePage,
    pageStart,
    setQuery: (value: string) => updateParams({ q: value, page: "1" }),
    setSegment: (value: string) => updateParams({ segment: value, page: "1" }),
    setStatus: (value: string) => updateParams({ status: value, page: "1" }),
    setSortBy: (value: string) => updateParams({ sort: value, page: "1" }),
    setSortDir: (value: string) => updateParams({ dir: value, page: "1" }),
    goToPage: (nextPage: number) => updateParams({ page: String(nextPage) }),
  }
}
