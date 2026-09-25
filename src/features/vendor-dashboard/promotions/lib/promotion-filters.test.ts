import { describe, expect, it } from "vitest"
import type { PromotionCampaign } from "./mock-data"
import {
  computeChannelMix,
  computeFeaturedCampaigns,
  computeKpiSnapshot,
  filterAndSortCampaigns,
  getCtr,
  getRoas,
} from "./promotion-filters"

const campaign = (overrides: Partial<PromotionCampaign> = {}): PromotionCampaign => ({
  id: "cmp-001",
  name: "Spring Restock Boost",
  objective: "Revenue",
  channel: "Paid Search",
  status: "Active",
  budget: 12000,
  spend: 8400,
  revenue: 39800,
  impressions: 248000,
  clicks: 12400,
  conversions: 612,
  startDate: "2026-04-10",
  endDate: "2026-05-20",
  ...overrides,
})

describe("getRoas", () => {
  it("computes revenue / spend", () => {
    expect(getRoas(campaign({ spend: 100, revenue: 250 }))).toBe(2.5)
  })

  it("returns 0 instead of dividing by zero when spend is 0", () => {
    expect(getRoas(campaign({ spend: 0, revenue: 500 }))).toBe(0)
  })
})

describe("getCtr", () => {
  it("computes clicks / impressions as a percentage", () => {
    expect(getCtr(campaign({ impressions: 1000, clicks: 50 }))).toBe(5)
  })

  it("returns 0 instead of dividing by zero when impressions is 0", () => {
    expect(getCtr(campaign({ impressions: 0, clicks: 10 }))).toBe(0)
  })
})

describe("filterAndSortCampaigns", () => {
  const campaigns = [
    campaign({
      id: "a",
      name: "Spring Push",
      objective: "Revenue",
      channel: "Email",
      status: "Active",
      revenue: 100,
      spend: 50,
    }),
    campaign({
      id: "b",
      name: "Winter Sale",
      objective: "Retention",
      channel: "Social",
      status: "Paused",
      revenue: 300,
      spend: 100,
    }),
    campaign({
      id: "c",
      name: "Archived One",
      objective: "Awareness",
      channel: "Email",
      status: "Archived",
      revenue: 10,
      spend: 5,
    }),
  ]
  const baseFilters = {
    search: "",
    statusFilter: "All" as const,
    channelFilter: "All" as const,
    sortBy: "revenue" as const,
    sortDir: "desc" as const,
  }

  it("hides Archived campaigns when the status filter is 'All'", () => {
    const result = filterAndSortCampaigns(campaigns, baseFilters)
    expect(result.map((c) => c.id)).not.toContain("c")
  })

  it("shows Archived campaigns when the status filter explicitly selects Archived", () => {
    const result = filterAndSortCampaigns(campaigns, { ...baseFilters, statusFilter: "Archived" })
    expect(result.map((c) => c.id)).toEqual(["c"])
  })

  it("filters by a search term matching the name (case-insensitive)", () => {
    const result = filterAndSortCampaigns(campaigns, { ...baseFilters, search: "spring" })
    expect(result.map((c) => c.id)).toEqual(["a"])
  })

  it("filters by a search term matching the objective", () => {
    const result = filterAndSortCampaigns(campaigns, { ...baseFilters, search: "retention" })
    expect(result.map((c) => c.id)).toEqual(["b"])
  })

  it("filters by channel", () => {
    const result = filterAndSortCampaigns(campaigns, { ...baseFilters, channelFilter: "Social" })
    expect(result.map((c) => c.id)).toEqual(["b"])
  })

  it("filters by status", () => {
    const result = filterAndSortCampaigns(campaigns, { ...baseFilters, statusFilter: "Paused" })
    expect(result.map((c) => c.id)).toEqual(["b"])
  })

  it("sorts by revenue descending by default", () => {
    const result = filterAndSortCampaigns(campaigns, baseFilters)
    expect(result.map((c) => c.id)).toEqual(["b", "a"])
  })

  it("reverses order when sortDir is ascending", () => {
    const result = filterAndSortCampaigns(campaigns, { ...baseFilters, sortDir: "asc" })
    expect(result.map((c) => c.id)).toEqual(["a", "b"])
  })

  it("sorts by ROAS when sortBy is 'roas'", () => {
    const roasCampaigns = [
      campaign({ id: "low-roas", spend: 100, revenue: 100 }),
      campaign({ id: "high-roas", spend: 100, revenue: 500 }),
    ]
    const result = filterAndSortCampaigns(roasCampaigns, { ...baseFilters, sortBy: "roas" })
    expect(result.map((c) => c.id)).toEqual(["high-roas", "low-roas"])
  })

  it("sorts by CTR when sortBy is 'ctr'", () => {
    const ctrCampaigns = [
      campaign({ id: "low-ctr", impressions: 1000, clicks: 10 }),
      campaign({ id: "high-ctr", impressions: 1000, clicks: 90 }),
    ]
    const result = filterAndSortCampaigns(ctrCampaigns, { ...baseFilters, sortBy: "ctr" })
    expect(result.map((c) => c.id)).toEqual(["high-ctr", "low-ctr"])
  })

  it("sorts by end date when sortBy is 'endDate'", () => {
    const dateCampaigns = [
      campaign({ id: "later", endDate: "2026-12-01" }),
      campaign({ id: "sooner", endDate: "2026-01-01" }),
    ]
    const result = filterAndSortCampaigns(dateCampaigns, { ...baseFilters, sortBy: "endDate" })
    expect(result.map((c) => c.id)).toEqual(["later", "sooner"])
  })
})

describe("computeKpiSnapshot", () => {
  it("counts only Active campaigns and sums the rest across every non-archived campaign", () => {
    const set = [
      campaign({ status: "Active", spend: 100, revenue: 200, impressions: 1000, clicks: 50, conversions: 5 }),
      campaign({ status: "Paused", spend: 50, revenue: 100, impressions: 500, clicks: 25, conversions: 2 }),
    ]
    const snapshot = computeKpiSnapshot(set)
    expect(snapshot).toEqual({
      activeCampaigns: 1,
      spend: 150,
      revenue: 300,
      roas: 2,
      ctr: 5,
      conversions: 7,
      impressions: 1500,
      clicks: 75,
    })
  })

  it("returns zeroed roas/ctr instead of NaN for an empty set", () => {
    expect(computeKpiSnapshot([])).toEqual({
      activeCampaigns: 0,
      spend: 0,
      revenue: 0,
      roas: 0,
      ctr: 0,
      conversions: 0,
      impressions: 0,
      clicks: 0,
    })
  })
})

describe("computeChannelMix", () => {
  it("returns one entry per channel option, with revenue share as a percentage of the total", () => {
    const set = [campaign({ channel: "Email", revenue: 300 }), campaign({ channel: "Social", revenue: 100 })]
    const mix = computeChannelMix(set)
    const email = mix.find((item) => item.channel === "Email")
    const social = mix.find((item) => item.channel === "Social")
    expect(email).toMatchObject({ revenue: 300, share: 75 })
    expect(social).toMatchObject({ revenue: 100, share: 25 })
    expect(mix).toHaveLength(5)
  })

  it("returns 0% shares instead of NaN when there is no revenue at all", () => {
    const mix = computeChannelMix([])
    expect(mix.every((item) => item.share === 0)).toBe(true)
  })
})

describe("computeFeaturedCampaigns", () => {
  it("picks the highest-ROAS Active/Paused campaign as topPerformer and the lowest as underperformer", () => {
    const set = [
      campaign({ id: "high", status: "Active", spend: 100, revenue: 500 }),
      campaign({ id: "low", status: "Paused", spend: 100, revenue: 110 }),
    ]
    const featured = computeFeaturedCampaigns(set)
    expect(featured.topPerformer?.id).toBe("high")
    expect(featured.underperformer?.id).toBe("low")
  })

  it("excludes Draft campaigns from topPerformer/underperformer", () => {
    const set = [campaign({ id: "draft-only", status: "Draft" })]
    const featured = computeFeaturedCampaigns(set)
    expect(featured.topPerformer).toBeUndefined()
    expect(featured.underperformer).toBeUndefined()
  })

  it("picks the soonest-ending non-Completed campaign as endingSoon", () => {
    const set = [
      campaign({ id: "later", status: "Active", endDate: "2026-12-01" }),
      campaign({ id: "sooner", status: "Active", endDate: "2026-01-01" }),
      campaign({ id: "completed-sooner", status: "Completed", endDate: "2025-01-01" }),
    ]
    const featured = computeFeaturedCampaigns(set)
    expect(featured.endingSoon?.id).toBe("sooner")
  })
})
