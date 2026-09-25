import type { CampaignChannel, CampaignStatus, PromotionCampaign } from "./mock-data"

export interface CampaignFormState {
  name: string
  objective: PromotionCampaign["objective"]
  channel: CampaignChannel
  budget: string
  startDate: string
  endDate: string
}

export const todayDate = (): string => new Date().toISOString().slice(0, 10)

export const toInputDate = (isoDate: string): string => isoDate.slice(0, 10)

export const emptyFormState = (): CampaignFormState => ({
  name: "",
  objective: "Revenue",
  channel: "Email",
  budget: "",
  startDate: todayDate(),
  endDate: todayDate(),
})

/** The form state the "edit" modal pre-fills from an existing campaign. */
export function campaignToFormState(campaign: PromotionCampaign): CampaignFormState {
  return {
    name: campaign.name,
    objective: campaign.objective,
    channel: campaign.channel,
    budget: String(campaign.budget),
    startDate: toInputDate(campaign.startDate),
    endDate: toInputDate(campaign.endDate),
  }
}

export interface CampaignFormValidationError {
  title: string
  description: string
}

/** Verbatim port of the inline validation: a name and a positive budget are required, and the
 * end date must not be before the start date. Returns `null` when the form is valid. */
export function validateCampaignForm(form: CampaignFormState): CampaignFormValidationError | null {
  const budgetValue = Number(form.budget)

  if (!form.name.trim() || Number.isNaN(budgetValue) || budgetValue <= 0) {
    return { title: "Invalid form", description: "Please enter campaign name and a valid budget." }
  }

  if (new Date(form.endDate) < new Date(form.startDate)) {
    return { title: "Invalid date range", description: "End date must be after start date." }
  }

  return null
}

/** A fresh campaign always starts as a Draft with zeroed performance metrics - it has not run yet. */
export function buildNewCampaign(form: CampaignFormState): PromotionCampaign {
  return {
    id: `cmp-${Date.now()}`,
    name: form.name.trim(),
    objective: form.objective,
    channel: form.channel,
    status: "Draft",
    budget: Number(form.budget),
    spend: 0,
    revenue: 0,
    impressions: 0,
    clicks: 0,
    conversions: 0,
    startDate: form.startDate,
    endDate: form.endDate,
  }
}

/** Editing only ever touches the fields the form exposes - status and performance metrics are
 * carried over from the existing campaign untouched. */
export function buildUpdatedCampaign(existing: PromotionCampaign, form: CampaignFormState): PromotionCampaign {
  return {
    ...existing,
    name: form.name.trim(),
    objective: form.objective,
    channel: form.channel,
    budget: Number(form.budget),
    startDate: form.startDate,
    endDate: form.endDate,
  }
}

/** A duplicate is a new Draft with its own id/name/dates, starting from today with zeroed
 * performance metrics - it is a copy of the campaign's configuration, not its history. */
export function buildDuplicateCampaign(campaign: PromotionCampaign): PromotionCampaign {
  return {
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
}

/** Active <-> Paused only; any other status (Draft/Completed/Archived) has no toggle. */
export function nextPauseResumeStatus(status: CampaignStatus): CampaignStatus | null {
  if (status === "Active") return "Paused"
  if (status === "Paused") return "Active"
  return null
}
