export type CampaignStatus = "Active" | "Paused" | "Draft" | "Completed" | "Archived"
export type CampaignChannel = "Email" | "Paid Search" | "Social" | "Marketplace" | "On-site"

export interface PromotionCampaign {
  id: string
  name: string
  objective: "Revenue" | "Retention" | "Awareness" | "Inventory Push"
  channel: CampaignChannel
  status: CampaignStatus
  budget: number
  spend: number
  revenue: number
  impressions: number
  clicks: number
  conversions: number
  startDate: string
  endDate: string
}

export const PROMOTION_CAMPAIGNS: PromotionCampaign[] = [
  {
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
  },
  {
    id: "cmp-002",
    name: "Loyal Clinic Reorder Flow",
    objective: "Retention",
    channel: "Email",
    status: "Active",
    budget: 4800,
    spend: 3100,
    revenue: 21700,
    impressions: 102000,
    clicks: 7850,
    conversions: 511,
    startDate: "2026-04-18",
    endDate: "2026-06-01",
  },
  {
    id: "cmp-003",
    name: "New Camera Series Launch",
    objective: "Awareness",
    channel: "Social",
    status: "Active",
    budget: 9000,
    spend: 7050,
    revenue: 14200,
    impressions: 325000,
    clicks: 9200,
    conversions: 214,
    startDate: "2026-04-22",
    endDate: "2026-05-28",
  },
  {
    id: "cmp-004",
    name: "Composite Bundle Flash",
    objective: "Inventory Push",
    channel: "On-site",
    status: "Paused",
    budget: 3500,
    spend: 1900,
    revenue: 6600,
    impressions: 74000,
    clicks: 3120,
    conversions: 163,
    startDate: "2026-04-05",
    endDate: "2026-05-10",
  },
  {
    id: "cmp-005",
    name: "Marketplace Weekend Lift",
    objective: "Revenue",
    channel: "Marketplace",
    status: "Completed",
    budget: 6200,
    spend: 6200,
    revenue: 27800,
    impressions: 181000,
    clicks: 8840,
    conversions: 436,
    startDate: "2026-03-15",
    endDate: "2026-04-15",
  },
  {
    id: "cmp-006",
    name: "Dormant Accounts Winback",
    objective: "Retention",
    channel: "Email",
    status: "Draft",
    budget: 2800,
    spend: 0,
    revenue: 0,
    impressions: 0,
    clicks: 0,
    conversions: 0,
    startDate: "2026-05-12",
    endDate: "2026-06-12",
  },
  {
    id: "cmp-007",
    name: "High Margin Instruments",
    objective: "Revenue",
    channel: "Paid Search",
    status: "Paused",
    budget: 7500,
    spend: 5100,
    revenue: 15800,
    impressions: 198000,
    clicks: 7680,
    conversions: 294,
    startDate: "2026-03-25",
    endDate: "2026-05-30",
  },
  {
    id: "cmp-008",
    name: "Quarterly Procurement Push",
    objective: "Awareness",
    channel: "Social",
    status: "Archived",
    budget: 5300,
    spend: 5300,
    revenue: 8400,
    impressions: 143000,
    clicks: 4100,
    conversions: 118,
    startDate: "2026-02-12",
    endDate: "2026-03-12",
  },
]
