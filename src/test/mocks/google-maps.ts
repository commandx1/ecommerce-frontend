import { vi } from "vitest"

export type GoogleMapsStatus = "OK" | "ZERO_RESULTS" | "OVER_QUERY_LIMIT" | "REQUEST_DENIED" | "INVALID_REQUEST"

export interface PlacePrediction {
  place_id: string
  description: string
  structured_formatting?: { main_text: string; secondary_text: string }
}

export interface PlaceDetails {
  place_id: string
  formatted_address: string
  address_components: Array<{ long_name: string; short_name: string; types: string[] }>
  geometry: { location: { lat: () => number; lng: () => number } }
}

export interface GoogleMapsMockState {
  predictions: PlacePrediction[]
  predictionsStatus: GoogleMapsStatus
  placeDetails: PlaceDetails | null
  placeDetailsStatus: GoogleMapsStatus
  geocodeResults: PlaceDetails[]
  geocodeStatus: GoogleMapsStatus
}

export const buildPrediction = (overrides: Partial<PlacePrediction> = {}): PlacePrediction => ({
  place_id: "place-1",
  description: "1600 Amphitheatre Parkway, Mountain View, CA, USA",
  structured_formatting: {
    main_text: "1600 Amphitheatre Parkway",
    secondary_text: "Mountain View, CA, USA",
  },
  ...overrides,
})

export const buildPlaceDetails = (overrides: Partial<PlaceDetails> = {}): PlaceDetails => ({
  place_id: "place-1",
  formatted_address: "1600 Amphitheatre Parkway, Mountain View, CA 94043, USA",
  address_components: [
    { long_name: "1600", short_name: "1600", types: ["street_number"] },
    { long_name: "Amphitheatre Parkway", short_name: "Amphitheatre Pkwy", types: ["route"] },
    { long_name: "Mountain View", short_name: "Mountain View", types: ["locality"] },
    { long_name: "California", short_name: "CA", types: ["administrative_area_level_1"] },
    { long_name: "United States", short_name: "US", types: ["country"] },
    { long_name: "94043", short_name: "94043", types: ["postal_code"] },
  ],
  geometry: { location: { lat: () => 37.422, lng: () => -122.084 } },
  ...overrides,
})

const defaultState = (): GoogleMapsMockState => ({
  predictions: [buildPrediction()],
  predictionsStatus: "OK",
  placeDetails: buildPlaceDetails(),
  placeDetailsStatus: "OK",
  geocodeResults: [buildPlaceDetails()],
  geocodeStatus: "OK",
})

export const googleMapsState: GoogleMapsMockState = defaultState()

/** Tweaks what the fake Places/Geocoder APIs return for the current test. */
export const setGoogleMapsState = (patch: Partial<GoogleMapsMockState>): void => {
  Object.assign(googleMapsState, patch)
}

export const getPlacePredictionsSpy = vi.fn()
export const getDetailsSpy = vi.fn()
export const geocodeSpy = vi.fn()

class AutocompleteService {
  getPlacePredictions(
    request: unknown,
    callback: (predictions: PlacePrediction[] | null, status: GoogleMapsStatus) => void,
  ) {
    getPlacePredictionsSpy(request)
    const ok = googleMapsState.predictionsStatus === "OK"
    callback(ok ? googleMapsState.predictions : null, googleMapsState.predictionsStatus)
  }
}

class AutocompleteSessionToken {}

class PlacesService {
  getDetails(request: unknown, callback: (place: PlaceDetails | null, status: GoogleMapsStatus) => void) {
    getDetailsSpy(request)
    const ok = googleMapsState.placeDetailsStatus === "OK"
    callback(ok ? googleMapsState.placeDetails : null, googleMapsState.placeDetailsStatus)
  }
}

class Geocoder {
  geocode(request: unknown, callback?: (results: PlaceDetails[] | null, status: GoogleMapsStatus) => void) {
    geocodeSpy(request)
    const ok = googleMapsState.geocodeStatus === "OK"
    const results = ok ? googleMapsState.geocodeResults : null
    callback?.(results, googleMapsState.geocodeStatus)
    return Promise.resolve({ results: results ?? [] })
  }
}

const buildGoogleNamespace = () => ({
  maps: {
    places: {
      AutocompleteService,
      AutocompleteSessionToken,
      PlacesService,
      PlacesServiceStatus: {
        OK: "OK",
        ZERO_RESULTS: "ZERO_RESULTS",
        OVER_QUERY_LIMIT: "OVER_QUERY_LIMIT",
        REQUEST_DENIED: "REQUEST_DENIED",
        INVALID_REQUEST: "INVALID_REQUEST",
      },
    },
    Geocoder,
    GeocoderStatus: {
      OK: "OK",
      ZERO_RESULTS: "ZERO_RESULTS",
      OVER_QUERY_LIMIT: "OVER_QUERY_LIMIT",
      REQUEST_DENIED: "REQUEST_DENIED",
      INVALID_REQUEST: "INVALID_REQUEST",
    },
    Map: class {},
    Marker: class {},
    LatLng: class {},
    event: { clearInstanceListeners: vi.fn(), addListener: vi.fn() },
  },
})

/** Installs `window.google.maps` for tests that render address autocomplete. */
export const installGoogleMapsMock = (): void => {
  Object.assign(googleMapsState, defaultState())
  getPlacePredictionsSpy.mockClear()
  getDetailsSpy.mockClear()
  geocodeSpy.mockClear()
  ;(window as unknown as { google?: unknown }).google = buildGoogleNamespace()
}

/** Models "Google Maps script never loaded". */
export const removeGoogleMapsMock = (): void => {
  ;(window as unknown as { google?: unknown }).google = undefined
}
