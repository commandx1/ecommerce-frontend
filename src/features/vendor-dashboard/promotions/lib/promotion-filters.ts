import type { CampaignChannel, CampaignStatus, PromotionCampaign } from "./mock-data"

export const CHANNEL_OPTIONS: Array<CampaignChannel | "All"> = [
  "All",
  "Email",
  "Paid Search",
  "Social",
  "Marketplace",
  "On-site",
]

export const STATUS_OPTIONS: Array<CampaignStatus | "All"> = [
  "All",
  "Active",
  "Paused",
  "Draft",
  "Completed",
  "Archived",
]

export type CampaignSortKey = "revenue" | "spend" | "roas" | "ctr" | "endDate"
export type CampaignSortDir = "asc" | "desc"

export const getRoas = (campaign: PromotionCampaign): number =>
  campaign.spend > 0 ? campaign.revenue / campaign.spend : 0

export const getCtr = (campaign: PromotionCampaign): number =>
  campaign.impressions > 0 ? (campaign.clicks / campaign.impressions) * 100 : 0

export interface CampaignListFilters {
  search: string
  statusFilter: CampaignStatus | "All"
  channelFilter: CampaignChannel | "All"
  sortBy: CampaignSortKey
  sortDir: CampaignSortDir
}

/** Search + status + channel filter, then sort - a verbatim port of the inline table logic.
 * Archived campaigns are hidden unless the Status filter explicitly selects "Archived". */
export function filterAndSortCampaigns(
  campaigns: PromotionCampaign[],
  filters: CampaignListFilters,
): PromotionCampaign[] {
  const { search, statusFilter, channelFilter, sortBy, sortDir } = filters
  const normalizedSearch = search.trim().toLowerCase()

  const filtered = campaigns.filter((campaign) => {
    const matchSearch =
      normalizedSearch.length === 0 ||
      campaign.name.toLowerCase().includes(normalizedSearch) ||
      campaign.objective.toLowerCase().includes(normalizedSearch)
    const matchStatus = statusFilter === "All" || campaign.status === statusFilter
    const matchChannel = channelFilter === "All" || campaign.channel === channelFilter

    // Default behavior: hide archived unless explicitly selected
    const hideArchivedByDefault =
      statusFilter !== "Archived" && statusFilter === "All" ? campaign.status !== "Archived" : true

    return matchSearch && matchStatus && matchChannel && hideArchivedByDefault
  })

  return [...filtered].sort((a, b) => {
    let left: number
    let right: number

    switch (sortBy) {
      case "spend":
        left = a.spend
        right = b.spend
        break
      case "roas":
        left = getRoas(a)
        right = getRoas(b)
        break
      case "ctr":
        left = getCtr(a)
        right = getCtr(b)
        break
      case "endDate":
        left = new Date(a.endDate).getTime()
        right = new Date(b.endDate).getTime()
        break
      default:
        left = a.revenue
        right = b.revenue
    }

    if (left === right) return 0
    return sortDir === "asc" ? (left > right ? 1 : -1) : left > right ? -1 : 1
  })
}

export interface CampaignKpiSnapshot {
  activeCampaigns: number
  spend: number
  revenue: number
  roas: number
  ctr: number
  conversions: number
  impressions: number
  clicks: number
}

/** All KPIs are computed over non-archived campaigns only. */
export function computeKpiSnapshot(activeSet: PromotionCampaign[]): CampaignKpiSnapshot {
  const activeCampaigns = activeSet.filter((campaign) => campaign.status === "Active").length
  const spend = activeSet.reduce((sum, campaign) => sum + campaign.spend, 0)
  const revenue = activeSet.reduce((sum, campaign) => sum + campaign.revenue, 0)
  const impressions = activeSet.reduce((sum, campaign) => sum + campaign.impressions, 0)
  const clicks = activeSet.reduce((sum, campaign) => sum + campaign.clicks, 0)
  const conversions = activeSet.reduce((sum, campaign) => sum + campaign.conversions, 0)
  const roas = spend > 0 ? revenue / spend : 0
  const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0

  return { activeCampaigns, spend, revenue, roas, ctr, conversions, impressions, clicks }
}

export interface ChannelMixItem {
  channel: CampaignChannel
  revenue: number
  share: number
}

export function computeChannelMix(activeSet: PromotionCampaign[]): ChannelMixItem[] {
  const byChannel = CHANNEL_OPTIONS.filter((channel): channel is CampaignChannel => channel !== "All").map(
    (channel) => {
      const revenue = activeSet
        .filter((campaign) => campaign.channel === channel)
        .reduce((sum, campaign) => sum + campaign.revenue, 0)
      return { channel, revenue }
    },
  )
  const totalRevenue = byChannel.reduce((sum, item) => sum + item.revenue, 0)

  return byChannel.map((item) => ({
    ...item,
    share: totalRevenue > 0 ? (item.revenue / totalRevenue) * 100 : 0,
  }))
}

export interface FeaturedCampaigns {
  topPerformer?: PromotionCampaign
  underperformer?: PromotionCampaign
  endingSoon?: PromotionCampaign
}

export function computeFeaturedCampaigns(activeSet: PromotionCampaign[]): FeaturedCampaigns {
  const nonDraft = activeSet.filter((campaign) => campaign.status === "Active" || campaign.status === "Paused")
  const topPerformer = [...nonDraft].sort((a, b) => getRoas(b) - getRoas(a))[0]
  const underperformer = [...nonDraft].sort((a, b) => getRoas(a) - getRoas(b))[0]
  const endingSoon = [...activeSet]
    .filter((campaign) => campaign.status !== "Completed")
    .sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime())[0]

  return { topPerformer, underperformer, endingSoon }
}
