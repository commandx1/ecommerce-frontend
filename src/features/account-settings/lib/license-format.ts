import usStateList from "@/data/usstate-list.json"
import type { License, LicenseType } from "@/lib/api/licenses"
import { formatPaddedDate } from "@/lib/helpers/format"

export const US_STATES = usStateList.slice(
  0,
  usStateList.findIndex((state) => state.name === "Alberta"),
)

export const LICENSE_TYPE_LABELS: Record<LicenseType, string> = {
  DEA: "DEA",
  STATE_DENTAL: "State Dental",
}

export function formatStateOfLicense(abbreviation: string) {
  const state = US_STATES.find((s) => s.abbreviation === abbreviation)
  return state ? `${state.name} (${state.abbreviation})` : abbreviation
}

export function formatExpiration(license: License) {
  const date = new Date(license.year, license.month - 1, license.day)
  return formatPaddedDate(date)
}
