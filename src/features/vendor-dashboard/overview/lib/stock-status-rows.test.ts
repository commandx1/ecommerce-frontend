import { describe, expect, it } from "vitest"
import type { VendorStockSummaryResponse } from "@/lib/api/vendor-dashboard"
import { buildStockStatusRows, normalizeCriticalStockAlerts } from "./stock-status-rows"

const summary = (overrides: Partial<VendorStockSummaryResponse> = {}): VendorStockSummaryResponse => ({
  inStock: { count: 83, percentage: 83.4 },
  lowStock: { count: 12, percentage: 12.1 },
  outOfStock: { count: 5, percentage: 4.5 },
  criticStockAlerts: {
    content: [],
    totalPages: 0,
    totalElements: 0,
    last: true,
    first: true,
    numberOfElements: 0,
    size: 3,
    number: 0,
    empty: true,
  },
  ...overrides,
})

describe("buildStockStatusRows", () => {
  it("returns an empty array for a null/undefined summary", () => {
    expect(buildStockStatusRows(null)).toEqual([])
    expect(buildStockStatusRows(undefined)).toEqual([])
  })

  it("builds one row per bucket with its label, color and filter type", () => {
    const rows = buildStockStatusRows(summary())
    expect(rows.map((row) => row.key)).toEqual(["inStock", "lowStock", "outOfStock"])
    expect(rows[0]).toMatchObject({ label: "In Stock", color: "green", filterType: "ACTIVE", bucket: { count: 83 } })
  })

  it.each([
    ["inStock", { inStock: undefined as unknown as VendorStockSummaryResponse["inStock"] }],
    ["lowStock", { lowStock: null as unknown as VendorStockSummaryResponse["lowStock"] }],
    ["outOfStock", { outOfStock: undefined as unknown as VendorStockSummaryResponse["outOfStock"] }],
  ])("falls back to a zeroed bucket instead of crashing when %s is missing", (_label, overrides) => {
    const rows = buildStockStatusRows(summary(overrides))
    expect(rows.every((row) => Number.isFinite(row.bucket.count) && Number.isFinite(row.bucket.percentage))).toBe(true)
  })
})

describe("normalizeCriticalStockAlerts", () => {
  it("returns the alert list unchanged when it is a real array", () => {
    const alerts = [
      { stock: 2, name: "Gauze", coverPhotoPath: null, manufacturerCode: null, skuCode: null, userProductId: "up-1" },
    ]
    expect(
      normalizeCriticalStockAlerts(summary({ criticStockAlerts: { ...summary().criticStockAlerts, content: alerts } })),
    ).toEqual(alerts)
  })

  it.each([
    ["summary is null", null],
    ["summary is undefined", undefined],
    [
      "criticStockAlerts is missing",
      summary({ criticStockAlerts: undefined as unknown as VendorStockSummaryResponse["criticStockAlerts"] }),
    ],
    [
      "criticStockAlerts is null",
      summary({ criticStockAlerts: null as unknown as VendorStockSummaryResponse["criticStockAlerts"] }),
    ],
    [
      "criticStockAlerts.content is missing",
      summary({ criticStockAlerts: { totalPages: 0 } as unknown as VendorStockSummaryResponse["criticStockAlerts"] }),
    ],
    [
      "criticStockAlerts.content is not an array",
      summary({
        criticStockAlerts: { ...summary().criticStockAlerts, content: { name: "x" } as never },
      }),
    ],
  ])("returns an empty array instead of crashing when %s", (_label, value) => {
    expect(normalizeCriticalStockAlerts(value)).toEqual([])
  })
})
