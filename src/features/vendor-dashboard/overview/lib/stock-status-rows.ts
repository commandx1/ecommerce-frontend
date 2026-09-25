import type { VendorCriticalStockAlert, VendorStockSummaryResponse } from "@/lib/api/vendor-dashboard"

export interface StockStatusRow {
  key: string
  label: string
  color: "green" | "yellow" | "red"
  bucket: { count: number; percentage: number }
  filterType: string
}

const FALLBACK_BUCKET = { count: 0, percentage: 0 }

/** A bucket missing from an otherwise-valid `summary` (malformed 200 body) would otherwise
 * throw on `row.bucket.count` downstream and blank the whole dashboard. */
export function buildStockStatusRows(summary: VendorStockSummaryResponse | null | undefined): StockStatusRow[] {
  if (!summary) return []

  return [
    {
      key: "inStock",
      label: "In Stock",
      color: "green",
      bucket: summary.inStock ?? FALLBACK_BUCKET,
      filterType: "ACTIVE",
    },
    {
      key: "lowStock",
      label: "Low Stock",
      color: "yellow",
      bucket: summary.lowStock ?? FALLBACK_BUCKET,
      filterType: "LOW_STOCK",
    },
    {
      key: "outOfStock",
      label: "Out of Stock",
      color: "red",
      bucket: summary.outOfStock ?? FALLBACK_BUCKET,
      filterType: "OUT_OF_STOCK",
    },
  ]
}

/** A response without `criticStockAlerts`, or with a non-array `content`, must not throw and blank the dashboard. */
export function normalizeCriticalStockAlerts(
  summary: VendorStockSummaryResponse | null | undefined,
): VendorCriticalStockAlert[] {
  const alerts = summary?.criticStockAlerts?.content
  return Array.isArray(alerts) ? alerts : []
}
