import apiClient from "./client"

const ADDRESSES_DEDUP_WINDOW_MS = 2000
let inFlightAddressesRequest: Promise<Address[]> | null = null
let recentAddressesCache: { data: Address[]; fetchedAt: number } | null = null

export interface Address {
  id: string
  title: string
  fullName: string
  phoneNumber: string
  country: string
  state: string
  city: string
  district: string
  postalCode: string
  addressLine: string
  defaultAddress: boolean
  latitude: number
  longitude: number
  placeId: string
  formattedAddress: string
}

export type CreateAddressPayload = Omit<Address, "id">
export type UpdateAddressPayload = Partial<CreateAddressPayload>

function clearAddressesCache() {
  inFlightAddressesRequest = null
  recentAddressesCache = null
}

class AddressAPI {
  async getAddresses(): Promise<Address[]> {
    const now = Date.now()
    if (recentAddressesCache && now - recentAddressesCache.fetchedAt <= ADDRESSES_DEDUP_WINDOW_MS) {
      return recentAddressesCache.data
    }

    if (inFlightAddressesRequest) {
      return inFlightAddressesRequest
    }

    const requestPromise = (async () => {
      const response = await apiClient.get<Address[] | Address | { items?: Address[] }>("/address")
      const data = response.data as Address[] | Address | { items?: Address[] } | null | undefined

      if (Array.isArray(data)) {
        recentAddressesCache = { data, fetchedAt: Date.now() }
        return data
      }

      if (data && "items" in data && Array.isArray(data.items)) {
        recentAddressesCache = { data: data.items, fetchedAt: Date.now() }
        return data.items
      }

      if (!data) {
        recentAddressesCache = { data: [], fetchedAt: Date.now() }
        return []
      }

      const normalized = [data as Address]
      recentAddressesCache = { data: normalized, fetchedAt: Date.now() }
      return normalized
    })()

    inFlightAddressesRequest = requestPromise
    try {
      return await requestPromise
    } finally {
      inFlightAddressesRequest = null
    }
  }

  async getAddress(id: string): Promise<Address> {
    const response = await apiClient.get<Address>(`/address/${id}`)
    return response.data
  }

  async createAddress(payload: CreateAddressPayload): Promise<Address> {
    const response = await apiClient.post<Address>("/address", payload)
    clearAddressesCache()
    return response.data
  }

  async updateAddress(id: string, payload: UpdateAddressPayload): Promise<Address> {
    const response = await apiClient.put<Address>(`/address/${id}`, payload)
    clearAddressesCache()
    return response.data
  }

  async deleteAddress(id: string): Promise<void> {
    await apiClient.delete(`/address/${id}`)
    clearAddressesCache()
  }
}

export const addressAPI = new AddressAPI()
