import { apiRequest } from "@/lib/api/request"

export type CompanyRole = "OWNER" | "MANAGER" | "MEMBER"

export type ShipmentPolicy = "ONE_DAY" | "TWO_DAYS" | "THREE_DAYS" | "FOUR_DAYS" | "FIVE_DAYS"

export const SHIPMENT_POLICY_DAYS: Record<ShipmentPolicy, number> = {
  ONE_DAY: 1,
  TWO_DAYS: 2,
  THREE_DAYS: 3,
  FOUR_DAYS: 4,
  FIVE_DAYS: 5,
}

export const shipmentPolicyLabel = (policy: ShipmentPolicy) => {
  const d = SHIPMENT_POLICY_DAYS[policy]
  return `Ships in ${d} day${d > 1 ? "s" : ""}`
}

/** Vendor's own company record — mirrors the register-time company payload. */
export interface CompanyProfile {
  id: string
  name: string
  companyPhoto: string | null
  taxNumber: string | null
  email: string | null
  phoneNumber: string | null
  website: string | null
  description: string | null
  active: boolean
  createdDate: string
  /** Current user's role within the company; only OWNER may update it. */
  companyRole: CompanyRole | null
  /**
   * Backend `CompanyResponse.uberEnabled` is a primitive boolean (never null) — whether the
   * company's listings are eligible for Uber Direct delivery.
   */
  uberEnabled: boolean
  shipmentPolicy: ShipmentPolicy | null
}

export type UpdateCompanyPayload = Pick<
  CompanyProfile,
  | "name"
  | "companyPhoto"
  | "taxNumber"
  | "email"
  | "phoneNumber"
  | "website"
  | "description"
  | "uberEnabled"
  | "shipmentPolicy"
>

export async function getMyCompany(): Promise<CompanyProfile> {
  return apiRequest.requestJson<CompanyProfile>({
    client: "backend",
    method: "GET",
    url: "/companies/me",
    fallbackMessage: "Failed to fetch company information",
  })
}

export async function updateMyCompany(payload: UpdateCompanyPayload): Promise<CompanyProfile> {
  return apiRequest.requestJson<CompanyProfile, UpdateCompanyPayload>({
    client: "backend",
    method: "PUT",
    url: "/companies/me",
    data: payload,
    fallbackMessage: "Failed to update company information",
  })
}

export type InvitableCompanyRole = Exclude<CompanyRole, "OWNER">

export interface InviteCompanyUserPayload {
  email: string
  companyRole: InvitableCompanyRole
}

export async function inviteCompanyUser(payload: InviteCompanyUserPayload): Promise<void> {
  await apiRequest.requestJson<void, InviteCompanyUserPayload>({
    client: "backend",
    method: "POST",
    url: "/mail/invite-company-user",
    data: payload,
    fallbackMessage: "Failed to send invitation",
  })
}
