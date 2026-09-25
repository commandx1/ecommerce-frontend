import { describe, expect, it } from "vitest"
import type { VendorRevenuePeriod } from "@/lib/api/vendor-dashboard"
import { buildRevenueChartSeries } from "./revenue-chart-series"

const period = (overrides: Partial<VendorRevenuePeriod> = {}): VendorRevenuePeriod => ({
  period: "2026-06",
  periodMonth: 6,
  periodYear: 2026,
  totalRevenue: 1000,
  orderItemCount: 5,
  totalApprovedVendorPayment: 900,
  approvedVendorPaymentCount: 4,
  ...overrides,
})

describe("buildRevenueChartSeries", () => {
  it("maps each period into a parallel label and value array", () => {
    const result = buildRevenueChartSeries([
      period({ period: "2026-06", totalRevenue: 1000 }),
      period({ period: "2026-07", totalRevenue: 4200 }),
    ])
    expect(result).toEqual({ labels: ["2026-06", "2026-07"], values: [1000, 4200] })
  })

  it.each([
    ["undefined", undefined],
    ["null", null],
    ["a non-array object", { period: "2026-07" } as unknown as VendorRevenuePeriod[]],
  ])("returns empty arrays instead of crashing when periods is %s", (_label, value) => {
    expect(buildRevenueChartSeries(value)).toEqual({ labels: [], values: [] })
  })

  it("passes through a non-finite totalRevenue unchanged (the chart layer decides how to render it)", () => {
    const result = buildRevenueChartSeries([period({ totalRevenue: Number.NaN })])
    expect(Number.isNaN(result.values[0])).toBe(true)
  })
})
