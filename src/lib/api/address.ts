import apiClient from "./client"

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

class AddressAPI {
  async getAddresses(): Promise<Address[]> {
    const response = await apiClient.get<Address[] | Address | { items?: Address[] }>("/address")
    const data = response.data as Address[] | Address | { items?: Address[] } | null | undefined

    if (Array.isArray(data)) {
      return data
    }

    if (data && "items" in data && Array.isArray(data.items)) {
      return data.items
    }

    if (!data) {
      return []
    }

    return [data as Address]
  }

  async getAddress(id: string): Promise<Address> {
    const response = await apiClient.get<Address>(`/address/${id}`)
    return response.data
  }

  async createAddress(payload: CreateAddressPayload): Promise<Address> {
    const response = await apiClient.post<Address>("/address", payload)
    return response.data
  }

  async updateAddress(id: string, payload: UpdateAddressPayload): Promise<Address> {
    const response = await apiClient.put<Address>(`/address/${id}`, payload)
    return response.data
  }

  async deleteAddress(id: string): Promise<void> {
    await apiClient.delete(`/address/${id}`)
  }
}

export const addressAPI = new AddressAPI()
