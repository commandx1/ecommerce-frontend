"use client"

import { useReducer } from "react"
import { showToast } from "@/components/ui/Toast"
import { PROMOTION_CAMPAIGNS, type PromotionCampaign } from "../lib/mock-data"
import {
  buildDuplicateCampaign,
  buildNewCampaign,
  buildUpdatedCampaign,
  type CampaignFormState,
  nextPauseResumeStatus,
  validateCampaignForm,
} from "../lib/promotion-form"

type PromotionsAction =
  | { type: "add"; campaign: PromotionCampaign }
  | { type: "replace"; id: string; campaign: PromotionCampaign }
  | { type: "setStatus"; id: string; status: PromotionCampaign["status"] }

function promotionsReducer(state: PromotionCampaign[], action: PromotionsAction): PromotionCampaign[] {
  switch (action.type) {
    case "add":
      return [action.campaign, ...state]
    case "replace":
      return state.map((campaign) => (campaign.id === action.id ? action.campaign : campaign))
    case "setStatus":
      return state.map((campaign) => (campaign.id === action.id ? { ...campaign, status: action.status } : campaign))
    default:
      return state
  }
}

export interface PromotionsBoard {
  campaigns: PromotionCampaign[]
  createCampaign: (form: CampaignFormState) => boolean
  updateCampaign: (id: string, form: CampaignFormState) => boolean
  duplicateCampaign: (campaign: PromotionCampaign) => void
  togglePauseResume: (campaign: PromotionCampaign) => void
  archiveCampaign: (campaign: PromotionCampaign) => void
}

/** In-memory CRUD for the mock promotions board (no backend exists yet). `createCampaign`/
 * `updateCampaign` return whether the submission succeeded, so a failed validation keeps the
 * modal open with its draft values. */
export function usePromotionsBoard(): PromotionsBoard {
  const [campaigns, dispatch] = useReducer(promotionsReducer, PROMOTION_CAMPAIGNS)

  const createCampaign = (form: CampaignFormState): boolean => {
    const error = validateCampaignForm(form)
    if (error) {
      showToast.error(error.title, error.description)
      return false
    }

    const campaign = buildNewCampaign(form)
    dispatch({ type: "add", campaign })
    showToast.success("Campaign created", `${campaign.name} has been added as Draft.`)
    return true
  }

  const updateCampaign = (id: string, form: CampaignFormState): boolean => {
    const error = validateCampaignForm(form)
    if (error) {
      showToast.error(error.title, error.description)
      return false
    }

    const existing = campaigns.find((campaign) => campaign.id === id)
    if (!existing) return false

    const updated = buildUpdatedCampaign(existing, form)
    dispatch({ type: "replace", id, campaign: updated })
    showToast.success("Campaign updated", "Changes were saved successfully.")
    return true
  }

  const duplicateCampaign = (campaign: PromotionCampaign) => {
    const duplicate = buildDuplicateCampaign(campaign)
    dispatch({ type: "add", campaign: duplicate })
    showToast.info("Campaign duplicated", `${duplicate.name} is ready for edits.`)
  }

  const togglePauseResume = (campaign: PromotionCampaign) => {
    const nextStatus = nextPauseResumeStatus(campaign.status)
    if (!nextStatus) return

    dispatch({ type: "setStatus", id: campaign.id, status: nextStatus })
    showToast.success(
      nextStatus === "Paused" ? "Campaign paused" : "Campaign resumed",
      `${campaign.name} is now ${nextStatus.toLowerCase()}.`,
    )
  }

  const archiveCampaign = (campaign: PromotionCampaign) => {
    dispatch({ type: "setStatus", id: campaign.id, status: "Archived" })
    showToast.warning("Campaign archived", `${campaign.name} moved to archived campaigns.`)
  }

  return { campaigns, createCampaign, updateCampaign, duplicateCampaign, togglePauseResume, archiveCampaign }
}
