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
    return response.data.licenses
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
