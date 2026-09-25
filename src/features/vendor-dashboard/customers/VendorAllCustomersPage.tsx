"use client"

import { ArrowLeft, ArrowRight, Search } from "lucide-react"
import Link from "next/link"
import SectionHeading from "@/components/layout/SectionHeading"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import TopCustomersTable from "./components/TopCustomersTable"
import { useCustomerListFilters } from "./hooks/useCustomerListFilters"
import { CUSTOMER_HEALTH, CUSTOMER_SEGMENTS } from "./lib/customers-data"

const PAGE_SIZE = 10

export default function VendorAllCustomersPage() {
  const {
    query,
    segment,
    status,
    sortBy,
    sortDir,
    pageRows,
    sortedCount,
    totalPages,
    safePage,
    pageStart,
    setQuery,
    setSegment,
    setStatus,
    setSortBy,
    setSortDir,
    goToPage,
  } = useCustomerListFilters()

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
        <SectionHeading
          titleAs="h1"
          variant="technical"
          title="All Customers"
          description="Filter, sort, and inspect customer accounts across segments."
        />
      </section>

      <section className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-5">
        <div className="xl:col-span-2">
          <p className="mb-1 text-xs font-medium uppercase tracking-wider text-text-secondary">Search</p>
          <div className="flex h-11 items-center gap-2 rounded-2xl border border-border-soft bg-surface-elevated px-3 shadow-soft">
            <Search className="h-4 w-4 text-text-muted" />
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Customer, clinic or email"
              className="w-full bg-transparent text-sm text-text-primary outline-none placeholder:text-text-muted"
            />
          </div>
        </div>

        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-wider text-text-secondary">Segment</p>
          <Select value={segment} onValueChange={setSegment}>
            <SelectTrigger
              aria-label="Segment"
              className="h-11 w-full rounded-2xl border border-border-soft bg-surface-elevated shadow-soft"
            >
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
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger
              aria-label="Status"
              className="h-11 w-full rounded-2xl border border-border-soft bg-surface-elevated shadow-soft"
            >
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
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger
                aria-label="Sort By"
                className="h-11 w-full rounded-2xl border border-border-soft bg-surface-elevated shadow-soft"
              >
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
            <Select value={sortDir} onValueChange={setSortDir}>
              <SelectTrigger
                aria-label="Sort Direction"
                className="h-11 w-full rounded-2xl border border-border-soft bg-surface-elevated shadow-soft"
              >
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
        description={`${sortedCount} matched accounts`}
      />

      <section className="mt-5 flex items-center justify-between">
        <p className="text-sm text-text-secondary">
          Showing {pageRows.length === 0 ? 0 : pageStart + 1}-{Math.min(pageStart + PAGE_SIZE, sortedCount)} of{" "}
          {sortedCount}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={safePage <= 1}
            onClick={() => goToPage(safePage - 1)}
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
            onClick={() => goToPage(safePage + 1)}
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
