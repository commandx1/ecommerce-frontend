"use client"

import {
  BarChart3,
  Copy,
  Megaphone,
  PauseCircle,
  Pencil,
  PlayCircle,
  Plus,
  Search,
  Sparkles,
  Target,
  Trash2,
} from "lucide-react"
import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import Modal from "@/components/ui/Modal"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { showToast } from "@/components/ui/Toast"
import formatCurrency from "@/lib/helpers/formatCurrency"
import { cn } from "@/lib/utils"
import DashboardPanel from "../components/shared/DashboardPanel"
import { STATUS_TONE_CLASS_MAP } from "../components/shared/dashboardToneMaps"
import { type CampaignChannel, type CampaignStatus, PROMOTION_CAMPAIGNS, type PromotionCampaign } from "./mock-data"

type SortKey = "revenue" | "spend" | "roas" | "ctr" | "endDate"
type SortDir = "asc" | "desc"
type ModalMode = "create" | "edit"

interface CampaignFormState {
  name: string
  objective: PromotionCampaign["objective"]
  channel: CampaignChannel
  budget: string
  startDate: string
  endDate: string
}

const STATUS_OPTIONS: Array<CampaignStatus | "All"> = ["All", "Active", "Paused", "Draft", "Completed", "Archived"]
const CHANNEL_OPTIONS: Array<CampaignChannel | "All"> = [
  "All",
  "Email",
  "Paid Search",
  "Social",
  "Marketplace",
  "On-site",
]

const statusToneMap: Record<CampaignStatus, string> = {
  Active: STATUS_TONE_CLASS_MAP.success,
  Paused: STATUS_TONE_CLASS_MAP.warning,
  Draft: STATUS_TONE_CLASS_MAP.neutral,
  Completed: STATUS_TONE_CLASS_MAP.info,
  Archived: STATUS_TONE_CLASS_MAP.danger,
}

const objectiveOptions: PromotionCampaign["objective"][] = ["Revenue", "Retention", "Awareness", "Inventory Push"]

const channelColorMap: Record<CampaignChannel, string> = {
  Email: "bg-brand",
  "Paid Search": "bg-success",
  Social: "bg-warning",
  Marketplace: "bg-brand-strong",
  "On-site": "bg-text-muted",
}

const getRoas = (campaign: PromotionCampaign) => (campaign.spend > 0 ? campaign.revenue / campaign.spend : 0)
const getCtr = (campaign: PromotionCampaign) =>
  campaign.impressions > 0 ? (campaign.clicks / campaign.impressions) * 100 : 0

const toInputDate = (isoDate: string) => isoDate.slice(0, 10)

const todayDate = () => new Date().toISOString().slice(0, 10)

const emptyFormState: CampaignFormState = {
  name: "",
  objective: "Revenue",
  channel: "Email",
  budget: "",
  startDate: todayDate(),
  endDate: todayDate(),
}

export default function VendorPromotionsPage() {
  const [campaigns, setCampaigns] = useState<PromotionCampaign[]>(PROMOTION_CAMPAIGNS)
  const [period, setPeriod] = useState<"7D" | "30D" | "90D">("30D")
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<CampaignStatus | "All">("All")
  const [channelFilter, setChannelFilter] = useState<CampaignChannel | "All">("All")
  const [sortBy, setSortBy] = useState<SortKey>("revenue")
  const [sortDir, setSortDir] = useState<SortDir>("desc")
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<ModalMode>("create")
  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null)
  const [formState, setFormState] = useState<CampaignFormState>(emptyFormState)
  const [archiveModalOpen, setArchiveModalOpen] = useState(false)
  const [archiveTarget, setArchiveTarget] = useState<PromotionCampaign | null>(null)

  const activeSet = useMemo(() => campaigns.filter((campaign) => campaign.status !== "Archived"), [campaigns])

  const kpiSnapshot = useMemo(() => {
    const activeCampaigns = activeSet.filter((campaign) => campaign.status === "Active").length
    const spend = activeSet.reduce((sum, campaign) => sum + campaign.spend, 0)
    const revenue = activeSet.reduce((sum, campaign) => sum + campaign.revenue, 0)
    const impressions = activeSet.reduce((sum, campaign) => sum + campaign.impressions, 0)
    const clicks = activeSet.reduce((sum, campaign) => sum + campaign.clicks, 0)
    const conversions = activeSet.reduce((sum, campaign) => sum + campaign.conversions, 0)
    const roas = spend > 0 ? revenue / spend : 0
    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0

    return {
      activeCampaigns,
      spend,
      revenue,
      roas,
      ctr,
      conversions,
      impressions,
      clicks,
    }
  }, [activeSet])

  const channelMix = useMemo(() => {
    const byChannel = CHANNEL_OPTIONS.filter((channel) => channel !== "All").map((channel) => {
      const revenue = activeSet
        .filter((campaign) => campaign.channel === channel)
        .reduce((sum, campaign) => sum + campaign.revenue, 0)
      return { channel, revenue }
    })
    const totalRevenue = byChannel.reduce((sum, item) => sum + item.revenue, 0)

    return byChannel.map((item) => ({
      ...item,
      share: totalRevenue > 0 ? (item.revenue / totalRevenue) * 100 : 0,
    }))
  }, [activeSet])

  const featured = useMemo(() => {
    const nonDraft = activeSet.filter((campaign) => campaign.status === "Active" || campaign.status === "Paused")
    const topPerformer = [...nonDraft].sort((a, b) => getRoas(b) - getRoas(a))[0]
    const underperformer = [...nonDraft].sort((a, b) => getRoas(a) - getRoas(b))[0]
    const endingSoon = [...activeSet]
      .filter((campaign) => campaign.status !== "Completed")
      .sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime())[0]

    return {
      topPerformer,
      underperformer,
      endingSoon,
    }
  }, [activeSet])

  const filteredRows = useMemo(() => {
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

    const sorted = [...filtered].sort((a, b) => {
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

    return sorted
  }, [campaigns, channelFilter, search, sortBy, sortDir, statusFilter])

  const openCreateModal = () => {
    setModalMode("create")
    setEditingCampaignId(null)
    setFormState(emptyFormState)
    setModalOpen(true)
  }

  const openEditModal = (campaign: PromotionCampaign) => {
    setModalMode("edit")
    setEditingCampaignId(campaign.id)
    setFormState({
      name: campaign.name,
      objective: campaign.objective,
      channel: campaign.channel,
      budget: String(campaign.budget),
      startDate: toInputDate(campaign.startDate),
      endDate: toInputDate(campaign.endDate),
    })
    setModalOpen(true)
  }

  const handleSubmitModal = () => {
    const budgetValue = Number(formState.budget)

    if (!formState.name.trim() || Number.isNaN(budgetValue) || budgetValue <= 0) {
      showToast.error("Invalid form", "Please enter campaign name and a valid budget.")
      return
    }

    if (new Date(formState.endDate) < new Date(formState.startDate)) {
      showToast.error("Invalid date range", "End date must be after start date.")
      return
    }

    if (modalMode === "create") {
      const newCampaign: PromotionCampaign = {
        id: `cmp-${Date.now()}`,
        name: formState.name.trim(),
        objective: formState.objective,
        channel: formState.channel,
        status: "Draft",
        budget: budgetValue,
        spend: 0,
        revenue: 0,
        impressions: 0,
        clicks: 0,
        conversions: 0,
        startDate: formState.startDate,
        endDate: formState.endDate,
      }
      setCampaigns((prev) => [newCampaign, ...prev])
      showToast.success("Campaign created", `${newCampaign.name} has been added as Draft.`)
    } else if (editingCampaignId) {
      setCampaigns((prev) =>
        prev.map((campaign) =>
          campaign.id === editingCampaignId
            ? {
                ...campaign,
                name: formState.name.trim(),
                objective: formState.objective,
                channel: formState.channel,
                budget: budgetValue,
                startDate: formState.startDate,
                endDate: formState.endDate,
              }
            : campaign,
        ),
      )
      showToast.success("Campaign updated", "Changes were saved successfully.")
    }

    setModalOpen(false)
  }

  const handleDuplicate = (campaign: PromotionCampaign) => {
    const duplicate: PromotionCampaign = {
      ...campaign,
      id: `cmp-${Date.now()}`,
      name: `Copy • ${campaign.name}`,
      status: "Draft",
      spend: 0,
      revenue: 0,
      impressions: 0,
      clicks: 0,
      conversions: 0,
      startDate: todayDate(),
      endDate: campaign.endDate,
    }
    setCampaigns((prev) => [duplicate, ...prev])
    showToast.info("Campaign duplicated", `${duplicate.name} is ready for edits.`)
  }

  const handlePauseResume = (campaign: PromotionCampaign) => {
    if (campaign.status !== "Active" && campaign.status !== "Paused") return
    const nextStatus: CampaignStatus = campaign.status === "Active" ? "Paused" : "Active"
    setCampaigns((prev) => prev.map((row) => (row.id === campaign.id ? { ...row, status: nextStatus } : row)))
    showToast.success(
      nextStatus === "Paused" ? "Campaign paused" : "Campaign resumed",
      `${campaign.name} is now ${nextStatus.toLowerCase()}.`,
    )
  }

  const requestArchive = (campaign: PromotionCampaign) => {
    setArchiveTarget(campaign)
    setArchiveModalOpen(true)
  }

  const closeArchiveModal = () => {
    setArchiveModalOpen(false)
    setArchiveTarget(null)
  }

  const confirmArchive = () => {
    if (!archiveTarget) return

    setCampaigns((prev) => prev.map((row) => (row.id === archiveTarget.id ? { ...row, status: "Archived" } : row)))
    showToast.warning("Campaign archived", `${archiveTarget.name} moved to archived campaigns.`)
    closeArchiveModal()
  }

  return (
    <>
      <section className="mb-8 rounded-3xl border border-border-soft bg-linear-to-br from-brand/8 via-surface-elevated to-warning/8 p-6 shadow-soft">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">Promotions</h1>
            <p className="mt-1 text-text-secondary">
              Campaign performance and operational control in one hybrid command center.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" className="rounded-xl px-4">
              Export
            </Button>
            <Button type="button" onClick={openCreateModal} className="rounded-xl px-4">
              <Plus className="mr-1 h-4 w-4" />
              Create Campaign
            </Button>
          </div>
        </div>

        <div className="inline-flex rounded-xl border border-border-soft bg-surface-elevated p-1">
          {(["7D", "30D", "90D"] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setPeriod(item)}
              className={cn(
                "rounded-lg px-4 py-2 text-sm transition-colors",
                period === item ? "bg-brand text-primary-foreground" : "text-text-secondary hover:text-text-primary",
              )}
            >
              {item}
            </button>
          ))}
        </div>
      </section>

      <section className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-6">
        <MetricCard
          label="Active Campaigns"
          value={String(kpiSnapshot.activeCampaigns)}
          tone="success"
          icon={<Megaphone />}
        />
        <MetricCard label="Spend" value={formatCurrency(kpiSnapshot.spend)} tone="warning" icon={<Target />} />
        <MetricCard
          label="Attributed Revenue"
          value={formatCurrency(kpiSnapshot.revenue)}
          tone="info"
          icon={<Sparkles />}
        />
        <MetricCard label="ROAS" value={`${kpiSnapshot.roas.toFixed(2)}x`} tone="success" icon={<BarChart3 />} />
        <MetricCard label="CTR" value={`${kpiSnapshot.ctr.toFixed(2)}%`} tone="neutral" icon={<Target />} />
        <MetricCard label="Conversions" value={String(kpiSnapshot.conversions)} tone="info" icon={<Sparkles />} />
      </section>

      <div className="mb-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <DashboardPanel title="Channel Mix" description="Revenue contribution by marketing channel">
          <div className="space-y-4">
            {channelMix.map((item) => (
              <div key={item.channel}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium text-text-primary">{item.channel}</span>
                  <span className="text-text-secondary">{formatCurrency(item.revenue)}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-surface-muted">
                  <div
                    className={cn("h-2 rounded-full", channelColorMap[item.channel])}
                    style={{ width: `${item.share}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </DashboardPanel>

        <DashboardPanel
          title="Conversion Funnel"
          description="Impressions to conversions across non-archived campaigns"
        >
          <div className="space-y-3">
            <FunnelRow label="Impressions" value={kpiSnapshot.impressions} color="bg-brand" width={100} />
            <FunnelRow
              label="Clicks"
              value={kpiSnapshot.clicks}
              color="bg-success"
              width={kpiSnapshot.impressions > 0 ? (kpiSnapshot.clicks / kpiSnapshot.impressions) * 100 : 0}
            />
            <FunnelRow
              label="Conversions"
              value={kpiSnapshot.conversions}
              color="bg-warning"
              width={kpiSnapshot.clicks > 0 ? (kpiSnapshot.conversions / kpiSnapshot.clicks) * 100 : 0}
            />
          </div>
        </DashboardPanel>
      </div>

      <section className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <FeaturedCampaignCard
          title="Top Performer"
          description="Highest ROAS among active campaigns"
          campaign={featured.topPerformer}
          accentClassName="border-success/25 bg-success/10"
        />
        <FeaturedCampaignCard
          title="Needs Optimization"
          description="Lowest ROAS with active spend"
          campaign={featured.underperformer}
          accentClassName="border-warning/30 bg-warning/10"
        />
        <FeaturedCampaignCard
          title="Ending Soon"
          description="Campaign approaching end date"
          campaign={featured.endingSoon}
          accentClassName="border-brand/25 bg-brand/10"
        />
      </section>

      <DashboardPanel
        title="Campaign Operations"
        description="Create, edit, duplicate, pause/resume, and archive campaigns"
      >
        <div className="mb-4 grid grid-cols-1 gap-3 xl:grid-cols-5">
          <div className="xl:col-span-2">
            <div className="flex h-11 items-center gap-2 rounded-2xl border border-border-soft bg-surface-elevated px-3 shadow-soft">
              <Search className="h-4 w-4 text-text-muted" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search campaign or objective"
                className="w-full bg-transparent text-sm text-text-primary outline-none placeholder:text-text-muted"
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as CampaignStatus | "All")}>
            <SelectTrigger className="h-11 w-full rounded-2xl border border-border-soft bg-surface-elevated shadow-soft">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={channelFilter} onValueChange={(value) => setChannelFilter(value as CampaignChannel | "All")}>
            <SelectTrigger className="h-11 w-full rounded-2xl border border-border-soft bg-surface-elevated shadow-soft">
              <SelectValue placeholder="Channel" />
            </SelectTrigger>
            <SelectContent>
              {CHANNEL_OPTIONS.map((channel) => (
                <SelectItem key={channel} value={channel}>
                  {channel}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="grid grid-cols-2 gap-2">
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortKey)}>
              <SelectTrigger className="h-11 w-full rounded-2xl border border-border-soft bg-surface-elevated shadow-soft">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="revenue">Revenue</SelectItem>
                <SelectItem value="spend">Spend</SelectItem>
                <SelectItem value="roas">ROAS</SelectItem>
                <SelectItem value="ctr">CTR</SelectItem>
                <SelectItem value="endDate">End Date</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortDir} onValueChange={(value) => setSortDir(value as SortDir)}>
              <SelectTrigger className="h-11 w-full rounded-2xl border border-border-soft bg-surface-elevated shadow-soft">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">Desc</SelectItem>
                <SelectItem value="asc">Asc</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-287.5">
            <thead className="border-y border-border-soft bg-surface-muted/70">
              <tr>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-text-secondary">
                  Campaign
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-text-secondary">
                  Status
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-text-secondary">
                  Channel
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-text-secondary">
                  Budget
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-text-secondary">
                  Spend
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-text-secondary">
                  Revenue
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-text-secondary">
                  ROAS
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-text-secondary">
                  CTR
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-text-secondary">
                  Start / End
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-text-secondary">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((campaign) => (
                <tr key={campaign.id} className="border-b border-border-soft/80">
                  <td className="px-4 py-3 text-center">
                    <div className="font-medium text-text-primary">{campaign.name}</div>
                    <div className="text-xs text-text-secondary">{campaign.objective}</div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={cn(
                        "inline-flex rounded-full border px-2 py-0.5 text-xs",
                        statusToneMap[campaign.status],
                      )}
                    >
                      {campaign.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-text-secondary">{campaign.channel}</td>
                  <td className="px-4 py-3 text-center text-text-primary">{formatCurrency(campaign.budget)}</td>
                  <td className="px-4 py-3 text-center text-text-primary">{formatCurrency(campaign.spend)}</td>
                  <td className="px-4 py-3 text-center font-semibold text-text-primary">
                    {formatCurrency(campaign.revenue)}
                  </td>
                  <td className="px-4 py-3 text-center text-text-primary">{getRoas(campaign).toFixed(2)}x</td>
                  <td className="px-4 py-3 text-center text-text-primary">{getCtr(campaign).toFixed(2)}%</td>
                  <td className="px-4 py-3 text-center text-sm text-text-secondary">
                    {campaign.startDate} → {campaign.endDate}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <ActionIconButton
                        onClick={() => openEditModal(campaign)}
                        icon={<Pencil className="h-4 w-4" />}
                        label="Edit"
                      />
                      <ActionIconButton
                        onClick={() => handleDuplicate(campaign)}
                        icon={<Copy className="h-4 w-4" />}
                        label="Duplicate"
                      />
                      {(campaign.status === "Active" || campaign.status === "Paused") && (
                        <ActionIconButton
                          onClick={() => handlePauseResume(campaign)}
                          icon={
                            campaign.status === "Active" ? (
                              <PauseCircle className="h-4 w-4" />
                            ) : (
                              <PlayCircle className="h-4 w-4" />
                            )
                          }
                          label={campaign.status === "Active" ? "Pause" : "Resume"}
                        />
                      )}
                      {campaign.status !== "Archived" && (
                        <ActionIconButton
                          onClick={() => requestArchive(campaign)}
                          icon={<Trash2 className="h-4 w-4" />}
                          label="Archive"
                          tone="danger"
                        />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DashboardPanel>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalMode === "create" ? "Create Campaign" : "Edit Campaign"}
        maxWidthClassName="max-w-2xl"
        contentClassName="rounded-3xl border border-border-soft bg-surface-elevated"
      >
        <div className="p-6">
          <h2 className="mb-1 text-2xl font-semibold text-text-primary">
            {modalMode === "create" ? "Create Campaign" : "Edit Campaign"}
          </h2>
          <p className="mb-5 text-sm text-text-secondary">
            Mock-only campaign form for dashboard workflow prototyping.
          </p>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="md:col-span-2">
              <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-text-secondary">
                Campaign Name
              </span>
              <input
                value={formState.name}
                onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))}
                className="h-11 w-full rounded-xl border border-border-soft bg-surface px-3 text-sm text-text-primary outline-none focus:border-brand/50"
                placeholder="e.g. Summer Instruments Lift"
              />
            </label>

            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wider text-text-secondary">Objective</p>
              <Select
                value={formState.objective}
                onValueChange={(value) =>
                  setFormState((prev) => ({ ...prev, objective: value as PromotionCampaign["objective"] }))
                }
              >
                <SelectTrigger className="h-11 w-full rounded-xl border border-border-soft bg-surface shadow-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {objectiveOptions.map((objective) => (
                    <SelectItem key={objective} value={objective}>
                      {objective}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wider text-text-secondary">Channel</p>
              <Select
                value={formState.channel}
                onValueChange={(value) => setFormState((prev) => ({ ...prev, channel: value as CampaignChannel }))}
              >
                <SelectTrigger className="h-11 w-full rounded-xl border border-border-soft bg-surface shadow-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CHANNEL_OPTIONS.filter((channel) => channel !== "All").map((channel) => (
                    <SelectItem key={channel} value={channel}>
                      {channel}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <label>
              <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-text-secondary">
                Budget (USD)
              </span>
              <input
                type="number"
                min={1}
                value={formState.budget}
                onChange={(event) => setFormState((prev) => ({ ...prev, budget: event.target.value }))}
                className="h-11 w-full rounded-xl border border-border-soft bg-surface px-3 text-sm text-text-primary outline-none focus:border-brand/50"
              />
            </label>

            <label>
              <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-text-secondary">
                Start Date
              </span>
              <input
                type="date"
                value={formState.startDate}
                onChange={(event) => setFormState((prev) => ({ ...prev, startDate: event.target.value }))}
                className="h-11 w-full rounded-xl border border-border-soft bg-surface px-3 text-sm text-text-primary outline-none focus:border-brand/50"
              />
            </label>

            <label>
              <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-text-secondary">
                End Date
              </span>
              <input
                type="date"
                value={formState.endDate}
                onChange={(event) => setFormState((prev) => ({ ...prev, endDate: event.target.value }))}
                className="h-11 w-full rounded-xl border border-border-soft bg-surface px-3 text-sm text-text-primary outline-none focus:border-brand/50"
              />
            </label>
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)} className="rounded-xl px-4">
              Cancel
            </Button>
            <Button type="button" onClick={handleSubmitModal} className="rounded-xl px-4">
              {modalMode === "create" ? "Create" : "Save Changes"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={archiveModalOpen}
        onClose={closeArchiveModal}
        title="Archive Campaign"
        maxWidthClassName="max-w-md"
        contentClassName="rounded-2xl border border-border-soft bg-surface-elevated"
      >
        <div className="p-6">
          <h3 className="mb-2 text-lg font-semibold text-text-primary">Archive this campaign?</h3>
          <p className="mb-4 text-sm text-text-secondary">
            {archiveTarget
              ? `“${archiveTarget.name}” will be moved to archived campaigns.`
              : "This campaign will be archived."}
          </p>
          <p className="mb-6 text-xs text-text-muted">You can still view archived campaigns from the status filter.</p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={closeArchiveModal} className="rounded-xl px-4">
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={confirmArchive} className="rounded-xl px-4">
              Archive
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}

function MetricCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string
  value: string
  icon: React.ReactNode
  tone: "success" | "warning" | "info" | "neutral"
}) {
  const toneMap = {
    success: "border-success/20 bg-success/8",
    warning: "border-warning/24 bg-warning/8",
    info: "border-brand/20 bg-brand/8",
    neutral: "border-border-soft bg-surface-elevated",
  }

  return (
    <div className={cn("rounded-2xl border p-4 shadow-soft", toneMap[tone])}>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-text-secondary">{label}</span>
        <span className="text-text-secondary">{icon}</span>
      </div>
      <div className="text-2xl font-bold text-text-primary">{value}</div>
    </div>
  )
}

function FunnelRow({ label, value, width, color }: { label: string; value: number; width: number; color: string }) {
  const safeWidth = Math.max(8, Math.min(100, width))

  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="text-text-secondary">{label}</span>
        <span className="font-medium text-text-primary">{value.toLocaleString("en-US")}</span>
      </div>
      <div className="h-2 w-full rounded-full bg-surface-muted">
        <div className={cn("h-2 rounded-full", color)} style={{ width: `${safeWidth}%` }}></div>
      </div>
    </div>
  )
}

function FeaturedCampaignCard({
  title,
  description,
  campaign,
  accentClassName,
}: {
  title: string
  description: string
  campaign?: PromotionCampaign
  accentClassName: string
}) {
  return (
    <div className={cn("rounded-2xl border p-4 shadow-soft", accentClassName)}>
      <p className="text-xs uppercase tracking-wider text-text-secondary">{title}</p>
      <p className="mt-1 text-xs text-text-secondary">{description}</p>
      {campaign ? (
        <>
          <h3 className="mt-3 font-semibold text-text-primary">{campaign.name}</h3>
          <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-lg border border-border-soft bg-surface-elevated p-2">
              <div className="text-xs text-text-secondary">ROAS</div>
              <div className="font-semibold text-text-primary">{getRoas(campaign).toFixed(2)}x</div>
            </div>
            <div className="rounded-lg border border-border-soft bg-surface-elevated p-2">
              <div className="text-xs text-text-secondary">CTR</div>
              <div className="font-semibold text-text-primary">{getCtr(campaign).toFixed(2)}%</div>
            </div>
          </div>
        </>
      ) : (
        <p className="mt-4 text-sm text-text-secondary">No matching campaign yet.</p>
      )}
    </div>
  )
}

function ActionIconButton({
  onClick,
  icon,
  label,
  tone = "default",
}: {
  onClick: () => void
  icon: React.ReactNode
  label: string
  tone?: "default" | "danger"
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-lg border px-2 py-1.5 text-text-secondary transition-colors hover:text-text-primary",
        tone === "danger"
          ? "border-danger/30 hover:bg-danger/10 hover:text-danger"
          : "border-border-soft hover:bg-surface-muted",
      )}
      aria-label={label}
      title={label}
    >
      {icon}
    </button>
  )
}
