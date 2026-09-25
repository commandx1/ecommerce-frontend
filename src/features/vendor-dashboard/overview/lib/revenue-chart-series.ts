import type { VendorRevenuePeriod } from "@/lib/api/vendor-dashboard"

export interface RevenueChartSeries {
  labels: string[]
  values: number[]
}

/** Guards a malformed 200 body - `periods` missing, null, or not an array would otherwise
 * throw on `.map` and blank the whole dashboard. */
export function buildRevenueChartSeries(periods: VendorRevenuePeriod[] | null | undefined): RevenueChartSeries {
  const list = Array.isArray(periods) ? periods : []
  return {
    labels: list.map((period) => period.period),
    values: list.map((period) => period.totalRevenue),
  }
}
