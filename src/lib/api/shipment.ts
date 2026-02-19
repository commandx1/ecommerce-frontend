import apiClient from "./client"

export interface ShipmentRate {
  objectId: string
  provider: string
  providerImage75: string
  providerImage200: string
  amount: string
  currency: string
  amountLocal: string
  currencyLocal: string
  arrivesBy: string | null
  durationTerms: string
  estimatedDays: number
  attributes: string[]
  servicelevel: {
    name: string
    token: string
    terms: string
    extendedToken: string
    parentServicelevel: string | null
  }
  test: boolean
}

export interface UberQuote {
  kind: string
  id: string
  created: string
  expires: string
  fee: number
  currency: string
  currency_type: string
  dropoff_eta: string
  duration: number
  pickup_duration: number
  dropoff_deadline: string
}

export interface ShipmentRatesResponse {
  shippoRates: ShipmentRate[]
  uberQuote: UberQuote | null
}

export interface ShipmentRatesPayload {
  addressId: string
  userId: string
  cartId: string
  parcels: {
    userProductId: string
  }[]
}

class ShipmentAPI {
  async getRates(payload: ShipmentRatesPayload): Promise<ShipmentRatesResponse> {
    const response = await apiClient.post<ShipmentRatesResponse>("/shipment/rates", payload)
    return response.data
  }
}

export const shipmentAPI = new ShipmentAPI()
