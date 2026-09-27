import { describe, expect, it } from "vitest"
import {
  geoDistributionOptions,
  periodicRevenueOptions,
  recentOrdersOptions,
  revenueSummaryOptions,
  reviewSummaryOptions,
  stockSummaryOptions,
  topSellingOptions,
} from "./overview-queries"

/**
 * The vendor overview widgets share the same "no backend push for a new Shippo order" problem as
 * the vendor orders list (see `VendorOrdersPage.refresh.test.tsx`): refetch on window focus and
 * every 60s while the tab stays visible, via `REFRESH_WHILE_VISIBLE` (`lib/query/query-client.ts`).
 * A config-level check (same style as `useNotificationQueries.test.tsx`'s
 * "polls every 60s and refetches on window focus") is enough here - the actual refetch/focus/
 * visibility *behaviour* is already proven end-to-end for the shared `vendor.orders.list` query
 * key in `VendorOrdersPage.refresh.test.tsx`, and `recentOrdersOptions` reuses that exact key.
 */
describe("vendor overview query options", () => {
  const cases: Array<[string, () => { refetchInterval?: unknown; refetchOnWindowFocus?: unknown; refetchIntervalInBackground?: unknown }]> = [
    ["revenueSummaryOptions", () => revenueSummaryOptions(30, true)],
    ["reviewSummaryOptions", () => reviewSummaryOptions(true)],
    ["periodicRevenueOptions", () => periodicRevenueOptions({ months: 12 }, true)],
    ["topSellingOptions", () => topSellingOptions({ page: 0, size: 4, daysFromNow: 30, sortDir: "desc" }, true)],
    ["stockSummaryOptions", () => stockSummaryOptions({ page: 0, size: 3 }, true)],
    ["geoDistributionOptions", () => geoDistributionOptions({ daysFromNow: 30 }, true)],
    ["recentOrdersOptions", () => recentOrdersOptions(true)],
  ]

  it.each(cases)("%s refetches on focus and every 60s, paused while the tab is hidden", (_name, buildOptions) => {
    const options = buildOptions()

    expect(options.refetchInterval).toBe(60_000)
    expect(options.refetchOnWindowFocus).toBe(true)
    expect(options.refetchIntervalInBackground).toBe(false)
  })
})
