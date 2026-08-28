import apiClient from "./client"

export type LicenseType = "DEA" | "STATE_DENTAL"

export interface License {
  id: string
  licenseType: LicenseType
  stateOfLicense: string | null
  licenseNumber: string
  year: number
  month: number
  day: number
  /** Null: pending review, true: approved, false: rejected. */
  approved: boolean | null
  rejectDescription: string | null
  expired: boolean
  createdDate: string | null
  updatedDate: string | null
}

export interface LicenseListResponse {
  licenses: License[]
  total: number
}

export interface CreateLicensePayload {
  licenseType: LicenseType
  /** Required only when licenseType is STATE_DENTAL. */
  stateOfLicense?: string
  licenseNumber: string
  year: number
  month: number
  day: number
}

class LicenseAPI {
  async getLicenses(): Promise<License[]> {
    const response = await apiClient.get<LicenseListResponse>("/licenses")
    // Normalised here rather than at each call site: callers store this straight into state and
    // then `.some()`/`.map()` over it. A malformed 200 would throw during the NEXT render, where
    // their try/catch cannot reach it (infra note #26).
    return Array.isArray(response.data?.licenses) ? response.data.licenses : []
  }

  async createLicense(payload: CreateLicensePayload): Promise<License> {
    const response = await apiClient.post<License>("/licenses", payload)
    return response.data
  }

  async deleteLicense(id: string): Promise<void> {
    await apiClient.delete(`/licenses/${id}`)
  }
}

export const licenseAPI = new LicenseAPI()
