import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { PromotionCampaign } from "./mock-data"
import {
  buildDuplicateCampaign,
  buildNewCampaign,
  buildUpdatedCampaign,
  type CampaignFormState,
  campaignToFormState,
  emptyFormState,
  nextPauseResumeStatus,
  toInputDate,
  validateCampaignForm,
} from "./promotion-form"

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
  startDate: "2026-04-10T00:00:00.000Z",
  endDate: "2026-05-20T00:00:00.000Z",
  ...overrides,
})

const form = (overrides: Partial<CampaignFormState> = {}): CampaignFormState => ({
  name: "New Campaign",
  objective: "Revenue",
  channel: "Email",
  budget: "1000",
  startDate: "2026-05-01",
  endDate: "2026-06-01",
  ...overrides,
})

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date("2026-05-15T12:00:00.000Z"))
})

afterEach(() => {
  vi.useRealTimers()
})

describe("toInputDate", () => {
  it("trims an ISO datetime down to its date portion", () => {
    expect(toInputDate("2026-04-10T00:00:00.000Z")).toBe("2026-04-10")
  })
})

describe("emptyFormState", () => {
  it("defaults to today for both dates and Revenue/Email for objective/channel", () => {
    const state = emptyFormState()
    expect(state).toEqual({
      name: "",
      objective: "Revenue",
      channel: "Email",
      budget: "",
      startDate: "2026-05-15",
      endDate: "2026-05-15",
    })
  })
})

describe("campaignToFormState", () => {
  it("maps a campaign's current values into editable form fields", () => {
    expect(campaignToFormState(campaign())).toEqual({
      name: "Spring Restock Boost",
      objective: "Revenue",
      channel: "Paid Search",
      budget: "12000",
      startDate: "2026-04-10",
      endDate: "2026-05-20",
    })
  })
})

describe("validateCampaignForm", () => {
  it("passes a valid form", () => {
    expect(validateCampaignForm(form())).toBeNull()
  })

  it.each([
    ["blank name", form({ name: "   " })],
    ["non-numeric budget", form({ budget: "not-a-number" })],
    ["zero budget", form({ budget: "0" })],
    ["negative budget", form({ budget: "-5" })],
  ])("rejects %s with the 'Invalid form' error", (_label, invalidForm) => {
    expect(validateCampaignForm(invalidForm)).toEqual({
      title: "Invalid form",
      description: "Please enter campaign name and a valid budget.",
    })
  })

  it("rejects an end date before the start date", () => {
    expect(validateCampaignForm(form({ startDate: "2026-06-01", endDate: "2026-05-01" }))).toEqual({
      title: "Invalid date range",
      description: "End date must be after start date.",
    })
  })

  it("accepts an end date equal to the start date", () => {
    expect(validateCampaignForm(form({ startDate: "2026-05-01", endDate: "2026-05-01" }))).toBeNull()
  })
})

describe("buildNewCampaign", () => {
  it("starts as a Draft with every performance metric zeroed", () => {
    const result = buildNewCampaign(form({ name: "  Padded Name  ", budget: "2500" }))
    expect(result).toMatchObject({
      name: "Padded Name",
      status: "Draft",
      budget: 2500,
      spend: 0,
      revenue: 0,
      impressions: 0,
      clicks: 0,
      conversions: 0,
    })
    expect(result.id).toMatch(/^cmp-\d+$/)
  })
})

describe("buildUpdatedCampaign", () => {
  it("overwrites only the form-editable fields, keeping status and performance metrics", () => {
    const existing = campaign({ status: "Paused", spend: 500, revenue: 900 })
    const result = buildUpdatedCampaign(existing, form({ name: "Renamed", budget: "3000" }))

    expect(result).toMatchObject({
      id: existing.id,
      name: "Renamed",
      budget: 3000,
      status: "Paused",
      spend: 500,
      revenue: 900,
    })
  })
})

describe("buildDuplicateCampaign", () => {
  it("prefixes the name, resets to Draft with zeroed metrics, and starts today", () => {
    const result = buildDuplicateCampaign(campaign())

    expect(result).toMatchObject({
      name: "Copy • Spring Restock Boost",
      status: "Draft",
      spend: 0,
      revenue: 0,
      impressions: 0,
      clicks: 0,
      conversions: 0,
      startDate: "2026-05-15",
      endDate: campaign().endDate,
    })
    expect(result.id).not.toBe(campaign().id)
  })
})

describe("nextPauseResumeStatus", () => {
  it.each([
    ["Active", "Paused"],
    ["Paused", "Active"],
  ] as const)("%s -> %s", (from, to) => {
    expect(nextPauseResumeStatus(from)).toBe(to)
  })

  it.each(["Draft", "Completed", "Archived"] as const)("returns null for %s (no toggle)", (status) => {
    expect(nextPauseResumeStatus(status)).toBeNull()
  })
})
