"use client"

import { ArrowLeft, ArrowRight, Search } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useMemo } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import TopCustomersTable from "../components/TopCustomersTable"
import { CUSTOMER_HEALTH, CUSTOMER_SEGMENTS, VENDOR_CUSTOMERS, type VendorCustomer } from "../data"

const PAGE_SIZE = 10

type SortKey = "totalSpend" | "lastOrderDaysAgo" | "averageOrderValue" | "orders" | "returnRate"
type SortDir = "asc" | "desc"

export default function VendorCustomersAllPage() {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()

  const query = searchParams.get("q") ?? ""
  const segment = searchParams.get("segment") ?? "all"
  const status = searchParams.get("status") ?? "all"
  const sortBy = (searchParams.get("sort") as SortKey | null) ?? "totalSpend"
  const sortDir = (searchParams.get("dir") as SortDir | null) ?? "desc"
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

  return (
    <>
      <section className="mb-8">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <Link
            href="/vendor-dashboard/customers"
            className="inline-flex items-center gap-1 text-sm text-text-secondary transition-colors hover:text-brand"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Customers
          </Link>
        </div>
        <div>
          <h1 className="text-3xl font-bold text-text-primary">All Customers</h1>
          <p className="mt-1 text-text-secondary">Filter, sort, and inspect customer accounts across segments.</p>
        </div>
      </section>

      <section className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-5">
        <div className="xl:col-span-2">
          <p className="mb-1 text-xs font-medium uppercase tracking-wider text-text-secondary">Search</p>
          <div className="flex h-11 items-center gap-2 rounded-2xl border border-border-soft bg-surface-elevated px-3 shadow-soft">
            <Search className="h-4 w-4 text-text-muted" />
            <input
              type="text"
              value={query}
              onChange={(event) => updateParams({ q: event.target.value, page: "1" })}
              placeholder="Customer, clinic or email"
              className="w-full bg-transparent text-sm text-text-primary outline-none placeholder:text-text-muted"
            />
          </div>
        </div>

        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-wider text-text-secondary">Segment</p>
          <Select value={segment} onValueChange={(value) => updateParams({ segment: value, page: "1" })}>
            <SelectTrigger className="h-11 w-full rounded-2xl border border-border-soft bg-surface-elevated shadow-soft">
              <SelectValue placeholder="All segments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All segments</SelectItem>
              {CUSTOMER_SEGMENTS.map((segmentValue) => (
                <SelectItem key={segmentValue} value={segmentValue}>
                  {segmentValue}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-wider text-text-secondary">Status</p>
          <Select value={status} onValueChange={(value) => updateParams({ status: value, page: "1" })}>
            <SelectTrigger className="h-11 w-full rounded-2xl border border-border-soft bg-surface-elevated shadow-soft">
              <SelectValue placeholder="All status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              {CUSTOMER_HEALTH.map((healthValue) => (
                <SelectItem key={healthValue} value={healthValue}>
                  {healthValue}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-wider text-text-secondary">Sort</p>
          <div className="grid grid-cols-2 gap-2">
            <Select value={sortBy} onValueChange={(value) => updateParams({ sort: value, page: "1" })}>
              <SelectTrigger className="h-11 w-full rounded-2xl border border-border-soft bg-surface-elevated shadow-soft">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="totalSpend">Total Spend</SelectItem>
                <SelectItem value="lastOrderDaysAgo">Last Order</SelectItem>
                <SelectItem value="averageOrderValue">AOV</SelectItem>
                <SelectItem value="orders">Orders</SelectItem>
                <SelectItem value="returnRate">Return Rate</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortDir} onValueChange={(value) => updateParams({ dir: value, page: "1" })}>
              <SelectTrigger className="h-11 w-full rounded-2xl border border-border-soft bg-surface-elevated shadow-soft">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">Desc</SelectItem>
                <SelectItem value="asc">Asc</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      <TopCustomersTable
        customers={pageRows}
        title="Customer Directory"
        description={`${sortedCustomers.length} matched accounts`}
      />

      <section className="mt-5 flex items-center justify-between">
        <p className="text-sm text-text-secondary">
          Showing {pageRows.length === 0 ? 0 : pageStart + 1}-{Math.min(pageStart + PAGE_SIZE, sortedCustomers.length)}{" "}
          of {sortedCustomers.length}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={safePage <= 1}
            onClick={() => updateParams({ page: String(safePage - 1) })}
            className="inline-flex h-9 items-center gap-1 rounded-lg border border-border-soft px-3 text-sm text-text-primary disabled:opacity-40"
          >
            <ArrowLeft className="h-4 w-4" />
            Prev
          </button>
          <span className="rounded-lg border border-border-soft bg-surface-elevated px-3 py-2 text-sm text-text-primary">
            Page {safePage} / {totalPages}
          </span>
          <button
            type="button"
            disabled={safePage >= totalPages}
            onClick={() => updateParams({ page: String(safePage + 1) })}
            className="inline-flex h-9 items-center gap-1 rounded-lg border border-border-soft px-3 text-sm text-text-primary disabled:opacity-40"
          >
            Next
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>
    </>
  )
}
