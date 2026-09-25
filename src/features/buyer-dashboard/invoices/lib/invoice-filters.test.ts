import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { buyerInvoices } from "../invoicesData"
import {
  computeInvoiceStats,
  filterInvoices,
  getPageCount,
  getSupplierOptions,
  PAGE_SIZE,
  paginate,
  sortInvoices,
} from "./invoice-filters"

// `buyerInvoices` is the same fixture `BuyerInvoicesPage.test.tsx` (the unchanged integration
// oracle) exercises through the rendered page - these tables pin the pure functions directly,
// the cheaper and more durable net per the design doc's test strategy (§8).

const NO_FILTER = { dateRange: "This Year", status: "All Statuses", supplier: "All Vendors", search: "" } as const

describe("filterInvoices", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-05-01"))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("uses the explicit `today` param, not the mocked system clock, when one is passed", () => {
    // Sanity check for the "today" plumbing itself: an explicit `today` wins over
    // `vi.setSystemTime`, so BuyerInvoicesPage's hardcoded 2026-05-01 truly drives the result.
    const withExplicitToday = filterInvoices(
      buyerInvoices,
      { ...NO_FILTER, dateRange: "Last 30 days" },
      new Date("2026-05-01"),
    )
    const withSystemTimeDefault = filterInvoices(buyerInvoices, { ...NO_FILTER, dateRange: "Last 30 days" })
    expect(withExplicitToday).toEqual(withSystemTimeDefault)
  })

  it.each([
    {
      name: "Last 30 days -> only the two invoices issued in the last 30 days of the fixed 'today'",
      dateRange: "Last 30 days",
      expectedIds: ["INV-2026-0156", "INV-2026-0155"],
    },
    {
      name: "This Year -> every invoice in the fixture",
      dateRange: "This Year",
      expectedIds: buyerInvoices.map((invoice) => invoice.id),
    },
  ] as const)("$name", ({ dateRange, expectedIds }) => {
    const result = filterInvoices(buyerInvoices, { ...NO_FILTER, dateRange })
    expect(result.map((invoice) => invoice.id)).toEqual(expectedIds)
  })

  it.each([
    { status: "Overdue", expectedIds: ["INV-2026-0154", "INV-2026-0149"] },
    { status: "Disputed", expectedIds: ["INV-2026-0152"] },
    { status: "All Statuses", expectedIds: buyerInvoices.map((invoice) => invoice.id) },
  ] as const)("status: $status", ({ status, expectedIds }) => {
    const result = filterInvoices(buyerInvoices, { ...NO_FILTER, status })
    expect(result.map((invoice) => invoice.id)).toEqual(expectedIds)
  })

  it("supplier: narrows to a single vendor's invoices", () => {
    const result = filterInvoices(buyerInvoices, { ...NO_FILTER, supplier: "DentalPro Supply" })
    expect(result.map((invoice) => invoice.id)).toEqual(["INV-2026-0156", "INV-2026-0153"])
  })

  it.each([
    { name: "matches by invoice id fragment", search: "0155", expectedIds: ["INV-2026-0155"] },
    { name: "matches by supplier name, case-insensitively", search: "medicore", expectedIds: ["INV-2026-0155"] },
    { name: "matches by items summary", search: "Archwires", expectedIds: ["INV-2026-0154"] },
    { name: "matches by amount", search: "8950", expectedIds: ["INV-2026-0155"] },
    { name: "no match -> empty", search: "zzzz-no-match", expectedIds: [] },
    {
      name: "blank search (whitespace only) -> no filtering",
      search: "   ",
      expectedIds: buyerInvoices.map((invoice) => invoice.id),
    },
  ] as const)("search: $name", ({ search, expectedIds }) => {
    const result = filterInvoices(buyerInvoices, { ...NO_FILTER, search })
    expect(result.map((invoice) => invoice.id)).toEqual(expectedIds)
  })

  it("combines date, status, supplier and search filters (AND, not OR)", () => {
    const result = filterInvoices(buyerInvoices, {
      dateRange: "This Year",
      status: "Paid",
      supplier: "DentalPro Supply",
      search: "Gloves",
    })
    expect(result.map((invoice) => invoice.id)).toEqual(["INV-2026-0153"])
  })
})

describe("sortInvoices", () => {
  it.each([
    { sortBy: "Date (Newest)", expectedFirstId: "INV-2026-0156", expectedLastId: "INV-2026-0147" },
    { sortBy: "Date (Oldest)", expectedFirstId: "INV-2026-0147", expectedLastId: "INV-2026-0156" },
    { sortBy: "Amount (High to Low)", expectedFirstId: "INV-2026-0152", expectedLastId: "INV-2026-0153" },
    { sortBy: "Amount (Low to High)", expectedFirstId: "INV-2026-0153", expectedLastId: "INV-2026-0152" },
  ] as const)("$sortBy", ({ sortBy, expectedFirstId, expectedLastId }) => {
    const result = sortInvoices(buyerInvoices, sortBy)
    expect(result[0]?.id).toBe(expectedFirstId)
    expect(result.at(-1)?.id).toBe(expectedLastId)
  })

  it("Status sorts alphabetically by status label", () => {
    const result = sortInvoices(buyerInvoices, "Status")
    const statuses = result.map((invoice) => invoice.status)
    const sorted = [...statuses].sort((a, b) => a.localeCompare(b))
    expect(statuses).toEqual(sorted)
  })

  it("does not mutate the input array", () => {
    const copy = [...buyerInvoices]
    sortInvoices(buyerInvoices, "Amount (High to Low)")
    expect(buyerInvoices).toEqual(copy)
  })
})

describe("paginate / getPageCount", () => {
  it("PAGE_SIZE is 6, matching the page's 'six invoices at a time' contract", () => {
    expect(PAGE_SIZE).toBe(6)
  })

  it("page 1 returns the first PAGE_SIZE items", () => {
    expect(paginate(buyerInvoices, 1)).toHaveLength(6)
    expect(paginate(buyerInvoices, 1).map((invoice) => invoice.id)).toEqual(
      buyerInvoices.slice(0, 6).map((invoice) => invoice.id),
    )
  })

  it("page 2 returns the remainder", () => {
    const page2 = paginate(buyerInvoices, 2)
    expect(page2).toHaveLength(buyerInvoices.length - 6)
  })

  it("getPageCount rounds up and never goes below 1, even for an empty list", () => {
    expect(getPageCount(buyerInvoices.length)).toBe(Math.ceil(buyerInvoices.length / 6))
    expect(getPageCount(0)).toBe(1)
  })

  it("honors a custom page size", () => {
    expect(paginate(buyerInvoices, 1, 3)).toHaveLength(3)
    expect(getPageCount(buyerInvoices.length, 3)).toBe(Math.ceil(buyerInvoices.length / 3))
  })
})

describe("computeInvoiceStats", () => {
  it("matches a hand-computed summary over the fixture", () => {
    const stats = computeInvoiceStats(buyerInvoices)

    const expectedOutstanding = buyerInvoices
      .filter((invoice) => invoice.status === "Pending" || invoice.status === "Overdue")
      .reduce((total, invoice) => total + invoice.amount, 0)
    const expectedPaidThisMonth = buyerInvoices
      .filter((invoice) => invoice.status === "Paid" && invoice.issueDate.startsWith("2026-04"))
      .reduce((total, invoice) => total + invoice.amount, 0)

    expect(stats.totalOutstanding).toBeCloseTo(expectedOutstanding)
    expect(stats.paidThisMonth).toBeCloseTo(expectedPaidThisMonth)
    expect(stats.paidCount).toBe(buyerInvoices.filter((invoice) => invoice.status === "Paid").length)
    expect(stats.pendingCount).toBe(buyerInvoices.filter((invoice) => invoice.status === "Pending").length)
    expect(stats.overdueCount).toBe(buyerInvoices.filter((invoice) => invoice.status === "Overdue").length)
    expect(stats.avgInvoiceAmount).toBeCloseTo(
      buyerInvoices.reduce((total, invoice) => total + invoice.amount, 0) / buyerInvoices.length,
    )
  })

  it("returns an average of 0 (not NaN) for an empty list", () => {
    expect(computeInvoiceStats([]).avgInvoiceAmount).toBe(0)
  })

  it("'paid this month' is pinned to April 2026 regardless of the current date (locked mock-data quirk)", () => {
    // Independently-locked from the date-range filter's "today" - see the lib's own comment.
    const stats = computeInvoiceStats(buyerInvoices)
    const anyPaidInApril = buyerInvoices.some(
      (invoice) => invoice.status === "Paid" && invoice.issueDate.startsWith("2026-04"),
    )
    expect(anyPaidInApril).toBe(true)
    expect(stats.paidThisMonth).toBeGreaterThan(0)
  })
})

describe("getSupplierOptions", () => {
  it("prefixes with 'All Vendors' and lists every distinct supplier, alphabetically", () => {
    const options = getSupplierOptions(buyerInvoices)
    expect(options[0]).toBe("All Vendors")
    const suppliers = options.slice(1)
    expect(suppliers).toEqual([...suppliers].sort((a, b) => a.localeCompare(b)))
    expect(new Set(suppliers).size).toBe(suppliers.length)
    expect(suppliers).toEqual(expect.arrayContaining(["DentalPro Supply", "MediCore Equipment"]))
  })

  it("returns just 'All Vendors' for an empty list", () => {
    expect(getSupplierOptions([])).toEqual(["All Vendors"])
  })
})
