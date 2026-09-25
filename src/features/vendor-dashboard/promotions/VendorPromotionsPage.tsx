"use client"

import { Plus } from "lucide-react"
import { useMemo, useState } from "react"
import DashboardPanel from "@/app/vendor-dashboard/components/shared/DashboardPanel"
import SectionHeading from "@/components/layout/SectionHeading"
import { Button } from "@/components/ui/button"
import SurfaceCard from "@/components/ui/SurfaceCard"
import { cn } from "@/lib/utils"
import ArchiveCampaignModal from "./components/ArchiveCampaignModal"
import CampaignFormModal, { type CampaignFormMode } from "./components/CampaignFormModal"
import CampaignMetricCards from "./components/CampaignMetricCards"
import ChannelMixPanel from "./components/ChannelMixPanel"
import ConversionFunnelPanel from "./components/ConversionFunnelPanel"
import FeaturedCampaignsSection from "./components/FeaturedCampaignsSection"
import PromotionsFilters from "./components/PromotionsFilters"
import PromotionsTable from "./components/PromotionsTable"
import { usePromotionsBoard } from "./hooks/usePromotionsBoard"
import type { CampaignChannel, CampaignStatus, PromotionCampaign } from "./lib/mock-data"
import {
  type CampaignSortDir,
  type CampaignSortKey,
  computeChannelMix,
  computeFeaturedCampaigns,
  computeKpiSnapshot,
  filterAndSortCampaigns,
} from "./lib/promotion-filters"
import { type CampaignFormState, campaignToFormState, emptyFormState } from "./lib/promotion-form"

export default function VendorPromotionsPage() {
  const { campaigns, createCampaign, updateCampaign, duplicateCampaign, togglePauseResume, archiveCampaign } =
    usePromotionsBoard()

  const [period, setPeriod] = useState<"7D" | "30D" | "90D">("30D")
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<CampaignStatus | "All">("All")
  const [channelFilter, setChannelFilter] = useState<CampaignChannel | "All">("All")
  const [sortBy, setSortBy] = useState<CampaignSortKey>("revenue")
  const [sortDir, setSortDir] = useState<CampaignSortDir>("desc")

  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<CampaignFormMode>("create")
  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null)
  const [formState, setFormState] = useState<CampaignFormState>(emptyFormState)

  const [archiveModalOpen, setArchiveModalOpen] = useState(false)
  const [archiveTarget, setArchiveTarget] = useState<PromotionCampaign | null>(null)

  const activeSet = useMemo(() => campaigns.filter((campaign) => campaign.status !== "Archived"), [campaigns])
  const kpiSnapshot = useMemo(() => computeKpiSnapshot(activeSet), [activeSet])
  const channelMix = useMemo(() => computeChannelMix(activeSet), [activeSet])
  const featured = useMemo(() => computeFeaturedCampaigns(activeSet), [activeSet])
  const filteredRows = useMemo(
    () => filterAndSortCampaigns(campaigns, { search, statusFilter, channelFilter, sortBy, sortDir }),
    [campaigns, search, statusFilter, channelFilter, sortBy, sortDir],
  )

  const openCreateModal = () => {
    setModalMode("create")
    setEditingCampaignId(null)
    setFormState(emptyFormState())
    setModalOpen(true)
  }

  const openEditModal = (campaign: PromotionCampaign) => {
    setModalMode("edit")
    setEditingCampaignId(campaign.id)
    setFormState(campaignToFormState(campaign))
    setModalOpen(true)
  }

  const handleSubmitModal = () => {
    const succeeded =
      modalMode === "create"
        ? createCampaign(formState)
        : editingCampaignId
          ? updateCampaign(editingCampaignId, formState)
          : false

    if (succeeded) {
      setModalOpen(false)
    }
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
    archiveCampaign(archiveTarget)
    closeArchiveModal()
  }

  return (
    <>
      <SurfaceCard as="section" variant="glass" className="mb-8 rounded-3xl p-6">
        <SectionHeading
          className="mb-5"
          titleAs="h1"
          variant="technical"
          title="Promotions"
          description="Campaign performance and operational control in one hybrid command center."
          actions={
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" className="rounded-xl px-4">
                Export
              </Button>
              <Button type="button" onClick={openCreateModal} className="rounded-xl px-4">
                <Plus className="mr-1 h-4 w-4" />
                Create Campaign
              </Button>
            </div>
          }
        />

        <div className="glass-tile inline-flex border border-border-soft p-1">
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
      </SurfaceCard>

      <CampaignMetricCards kpiSnapshot={kpiSnapshot} />

      <div className="mb-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <ChannelMixPanel channelMix={channelMix} />
        <ConversionFunnelPanel kpiSnapshot={kpiSnapshot} />
      </div>

      <FeaturedCampaignsSection featured={featured} />

      <DashboardPanel
        title="Campaign Operations"
        description="Create, edit, duplicate, pause/resume, and archive campaigns"
      >
        <PromotionsFilters
          search={search}
          onSearchChange={setSearch}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          channelFilter={channelFilter}
          onChannelFilterChange={setChannelFilter}
          sortBy={sortBy}
          onSortByChange={setSortBy}
          sortDir={sortDir}
          onSortDirChange={setSortDir}
        />

        <PromotionsTable
          campaigns={filteredRows}
          onEdit={openEditModal}
          onDuplicate={duplicateCampaign}
          onTogglePauseResume={togglePauseResume}
          onArchive={requestArchive}
        />
      </DashboardPanel>

      <CampaignFormModal
        isOpen={modalOpen}
        mode={modalMode}
        formState={formState}
        onFormStateChange={setFormState}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmitModal}
      />

      <ArchiveCampaignModal
        isOpen={archiveModalOpen}
        target={archiveTarget}
        onClose={closeArchiveModal}
        onConfirm={confirmArchive}
      />
    </>
  )
}
