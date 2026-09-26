import apiClient from "./client"

// Merges truly concurrent identical requests (e.g. React StrictMode's double-invoked effect, or
// two callers asking for the same vendor's rates in the same tick) into a single network round
// trip. This is NOT a response cache: nothing is retained once a request settles, so any call
// that isn't literally in flight at the same moment always hits `/shipment/rates` fresh — stale
// cached rates must never be served instead of a real request.
const inFlightRatesRequests = new Map<string, Promise<ShipmentRatesResponse>>()

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
  durationTerms: string | null
  estimatedDays: number | null
  attributes: string[]
  // Backend: ShipmentService.mapToRateResponse (ecommerce-api) only builds this object when
  // Shippo's own `rate.servicelevel()` is present, and even then every field inside it is
  // `.orElse(null)` off the Shippo SDK's Optional wrappers — so both the whole object and each
  // field within it can genuinely be null for a real carrier rate, not just in theory.
  servicelevel: {
    name: string | null
    token: string | null
    terms: string | null
    extendedToken: string | null
    parentServicelevel: string | null
  } | null
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

class ShipmentAPI {
  async getRates(payload: ShipmentRatesPayload): Promise<ShipmentRatesResponse> {
    const requestKey = buildRatesRequestKey(payload)

    const inFlight = inFlightRatesRequests.get(requestKey)
    if (inFlight) {
      return inFlight
    }

    const requestPromise = (async () => {
      const response = await apiClient.post<ShipmentRatesResponse>("/shipment/rates", payload)
      return response.data
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
