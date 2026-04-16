import apiClient from "./client"

const RATES_DEDUP_WINDOW_MS = 2000
const inFlightRatesRequests = new Map<string, Promise<ShipmentRatesResponse>>()
const recentRatesResponses = new Map<string, { data: ShipmentRatesResponse; fetchedAt: number }>()

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
  defaultShipmentFee?: number
}

export interface ShipmentRatesPayload {
  addressId: string
  userId: string
  cartId: string
  parcels: {
    userProductId: string
    quantity: number
  }[]
}

function buildRatesRequestKey(payload: ShipmentRatesPayload): string {
  const normalizedParcels = [...payload.parcels]
    .sort((a, b) => {
      if (a.userProductId === b.userProductId) {
        return a.quantity - b.quantity
      }
      return a.userProductId.localeCompare(b.userProductId)
    })
    .map((parcel) => `${parcel.userProductId}:${parcel.quantity}`)
    .join("|")

  return `${payload.addressId}__${payload.userId}__${payload.cartId}__${normalizedParcels}`
}

function pruneExpiredRatesCache(now: number) {
  for (const [key, entry] of recentRatesResponses.entries()) {
    if (now - entry.fetchedAt > RATES_DEDUP_WINDOW_MS) {
      recentRatesResponses.delete(key)
    }
  }
}

class ShipmentAPI {
  async getRates(payload: ShipmentRatesPayload): Promise<ShipmentRatesResponse> {
    const now = Date.now()
    pruneExpiredRatesCache(now)

    const requestKey = buildRatesRequestKey(payload)
    const cached = recentRatesResponses.get(requestKey)
    if (cached && now - cached.fetchedAt <= RATES_DEDUP_WINDOW_MS) {
      return cached.data
    }

    const inFlight = inFlightRatesRequests.get(requestKey)
    if (inFlight) {
      return inFlight
    }

    const requestPromise = (async () => {
      const response = await apiClient.post<ShipmentRatesResponse>("/shipment/rates", payload)
      const data = response.data
      recentRatesResponses.set(requestKey, { data, fetchedAt: Date.now() })
      return data
    })()

    inFlightRatesRequests.set(requestKey, requestPromise)
    try {
      return await requestPromise
    } finally {
      inFlightRatesRequests.delete(requestKey)
    }
  }
}

export const shipmentAPI = new ShipmentAPI()
